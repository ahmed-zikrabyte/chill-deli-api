import crypto from "crypto";
import mongoose, { type Types } from "mongoose";
import { chromium } from "playwright";
import { HTTP } from "../../../../config/http-status.config";
import { AppError } from "../../../../middleware/error.middleware";
import { AddressModel } from "../../../../models/address.model";
import { BoxModel } from "../../../../models/box.model";
import { BrowniePointsModel } from "../../../../models/brownie-point.model";
import { CouponModel } from "../../../../models/coupon.model";
import { type Items, OrderModel } from "../../../../models/order.model";
import { ProductModel } from "../../../../models/product.model";
import { UserModel } from "../../../../models/user.model";
import type { ServiceResponse } from "../../../../typings";
import { generateInvoiceHTML } from "../../../../utils/generate-invoice-html";
import { generateOrderId } from "../../../../utils/generateOrderId";
import { createOrder } from "../../../../utils/razorpay";

export class OrderUserService {
  private readonly orderModel = OrderModel;
  private readonly addressModel = AddressModel;
  private readonly userModel = UserModel;
  private readonly productModel = ProductModel;
  private readonly couponModel = CouponModel;
  private readonly boxModel = BoxModel;

  async createOrder(
    userId: string,
    orderData: {
      items: { productId: string; variantId: string; quantity: number }[];
      addressId: string;
      paymentMethod: "free" | "razorpay";
      couponCode?: string;
      boxId?: string;
      browniePointsToUse?: number;
    }
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1️⃣ Validate User & Address
      const user = await this.userModel.findById(userId).session(session);
      if (!user) throw new AppError("User not found", HTTP.NOT_FOUND);

      const address = await this.addressModel
        .findOne({ _id: orderData.addressId, userId })
        .session(session);
      if (!address) throw new AppError("Address not found", HTTP.NOT_FOUND);

      // 2️⃣ Validate Brownie Points (check available, but DO NOT deduct yet)
      const totalEarned = await BrowniePointsModel.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            type: "earned",
          },
        },
        { $group: { _id: null, total: { $sum: "$points" } } },
      ]);
      const totalSpent = await BrowniePointsModel.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            type: "spent",
          },
        },
        { $group: { _id: null, total: { $sum: "$points" } } },
      ]);

      const earned = totalEarned[0]?.total || 0;
      const spent = totalSpent[0]?.total || 0;
      const availablePoints = earned - spent;
      const requestedPoints = Number(orderData.browniePointsToUse ?? 0);

      if (isNaN(requestedPoints) || requestedPoints < 0)
        throw new AppError("Invalid brownie points value", HTTP.BAD_REQUEST);
      if (requestedPoints > availablePoints)
        throw new AppError(
          `Insufficient brownie points. Requested ${requestedPoints}, available ${availablePoints}`,
          HTTP.BAD_REQUEST
        );

      const browniePointsUsed = requestedPoints; // store intended usage
      const brownieDiscount = browniePointsUsed;

      // 3️⃣ Process Items & Subtotal
      const processedItems: any[] = [];
      let subtotal = 0;

      for (const item of orderData.items) {
        const product = await this.productModel
          .findById(item.productId)
          .session(session);
        if (!product)
          throw new AppError(
            `Product not found: ${item.productId}`,
            HTTP.NOT_FOUND
          );
        if (
          !product.isActive ||
          product.isDeleted ||
          product.stockStatus === "out-of-stock"
        )
          throw new AppError(
            `Product not available: ${product.name}`,
            HTTP.BAD_REQUEST
          );

        const variant = product.variants.find(
          (v) => v._id?.toString() === item.variantId
        );
        if (!variant)
          throw new AppError(
            `Variant not found for product: ${product.name}`,
            HTTP.NOT_FOUND
          );

        const itemTotal = variant.price * item.quantity;
        subtotal += itemTotal;

        processedItems.push({
          productId: product._id,
          name: product.name,
          variant: {
            _id: variant._id?.toString() || "",
            price: variant.price,
            weight: Number(variant.weight) || 0,
          },
          slug: product.slug,
          images: product.images,
          quantity: item.quantity,
          price: itemTotal,
        });
      }

      // 4️⃣ Coupon Processing
      let coupon = null;
      let discount = 0;
      if (orderData.couponCode) {
        coupon = await this.couponModel
          .findOne({
            code: { $regex: `^${orderData.couponCode}$`, $options: "i" },
            isActive: true,
            isDeleted: false,
            startDate: { $lte: new Date() },
            expiresAt: { $gt: new Date() },
          })
          .session(session);

        if (!coupon)
          throw new AppError("Invalid or expired coupon", HTTP.BAD_REQUEST);
        if (coupon.usedBy.includes(new mongoose.Types.ObjectId(userId)))
          throw new AppError(
            "Coupon already used by this user",
            HTTP.BAD_REQUEST
          );
        if (subtotal < coupon.minPurchaseAmount)
          throw new AppError(
            `Minimum purchase of ₹${coupon.minPurchaseAmount} required`,
            HTTP.BAD_REQUEST
          );

        discount =
          coupon.discountType === "percentage"
            ? (subtotal * coupon.discountValue) / 100
            : coupon.discountValue;
      }

      // 5️⃣ Validate Brownie Discount vs Subtotal
      const discountedAmount = subtotal - discount;
      if (brownieDiscount > discountedAmount)
        throw new AppError(
          `Brownie points discount (₹${brownieDiscount}) cannot exceed amount after coupon (₹${discountedAmount})`,
          HTTP.BAD_REQUEST
        );

      const finalDiscountedAmount = discountedAmount - brownieDiscount;

      const gstRate = 18;
      const gstTax = (finalDiscountedAmount * gstRate) / 100;
      const cgst = gstTax / 2;
      const sgst = gstTax / 2;
      const totalAmount = finalDiscountedAmount + gstTax;

      // 6️⃣ Box Validation
      let box = null;
      if (orderData.boxId) {
        box = await this.boxModel.findById(orderData.boxId).session(session);
        if (!box) throw new AppError("Box not found", HTTP.NOT_FOUND);

        const itemCount = processedItems.reduce(
          (sum, i) => sum + i.quantity,
          0
        );
        if (
          itemCount < (box.itemCountRange?.min ?? 0) ||
          itemCount > (box.itemCountRange?.max ?? Infinity)
        )
          throw new AppError(
            `Selected box can hold ${box.itemCountRange?.min}-${box.itemCountRange?.max} items`,
            HTTP.BAD_REQUEST
          );
      }

      // 7️⃣ Payment & Order Save (brownie points NOT deducted yet)
      const orderId = generateOrderId();
      let razorpayOrder = null;
      const paymentHistory: any[] = [];

      if (orderData.paymentMethod === "razorpay") {
        razorpayOrder = await createOrder(Math.round(totalAmount), orderId);
        paymentHistory.push({
          paymentStatus: "pending",
          paymentDate: new Date(),
          comment: "Initial order created",
          razorpayOrderId: razorpayOrder.id,
        });
      } else {
        paymentHistory.push({
          paymentStatus: "completed",
          paymentDate: new Date(),
          comment: "Free order",
        });
      }

      const newOrder = new this.orderModel({
        orderId,
        userId: new mongoose.Types.ObjectId(userId),
        items: processedItems,
        paymentStatus:
          orderData.paymentMethod === "free" ? "completed" : "pending",
        paymentMethod: orderData.paymentMethod,
        razorpayOrderId: razorpayOrder?.id || "",
        totalAmount: {
          amount: finalDiscountedAmount,
          gstTax,
          cgst,
          sgst,
          igst: 0,
          totalAmount,
        },
        status: orderData.paymentMethod === "free" ? "confirmed" : "pending",
        address: address.toObject(),
        coupon: coupon
          ? {
              code: coupon.code,
              discountType: coupon.discountType,
              discountValue: coupon.discountValue,
              discountAmount: discount,
              minPurchaseAmount: coupon.minPurchaseAmount,
              _id: coupon._id,
            }
          : null,
        box: box?.toObject(),
        paymentHistory,
        browniePointsUsed, // store intended usage
        brownieDiscount,
      });

      await newOrder.save({ session });

      // ✅ For free orders, deduct points immediately (optional)
      if (orderData.paymentMethod === "free" && browniePointsUsed > 0) {
        await this.userModel.findByIdAndUpdate(
          userId,
          { $inc: { browniePoints: -browniePointsUsed } },
          { session }
        );
        await BrowniePointsModel.create(
          [
            {
              userId: newOrder.userId,
              type: "spent",
              points: browniePointsUsed,
              orderId: newOrder._id,
              createdAt: new Date(),
              comment: "Points spent for free order",
            },
          ],
          { session }
        );
      }

      // Mark coupon used for FREE orders
      if (coupon && orderData.paymentMethod === "free") {
        await this.couponModel.findByIdAndUpdate(
          coupon._id,
          { $push: { usedBy: new mongoose.Types.ObjectId(userId) } },
          { session }
        );
      }

      await session.commitTransaction();

      return {
        data: newOrder,
        message: "Order created successfully",
        status: HTTP.OK,
        success: true,
        razorpayOrder,
      };
    } catch (error) {
      await session.abortTransaction();
      console.error("Order creation error:", error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  async verifyPayment(orderData: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    orderId: string;
  }) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1️⃣ Find the order
      const order = await this.orderModel
        .findOne({ orderId: orderData.orderId })
        .session(session);
      if (!order) throw new AppError("Order not found", HTTP.NOT_FOUND);

      // 2️⃣ Verify Razorpay signature
      const body =
        orderData.razorpayOrderId + "|" + orderData.razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZOR_PAY_SECRET_KEY!)
        .update(body.toString())
        .digest("hex");

      const isAuthentic = expectedSignature === orderData.razorpaySignature;

      // 3️⃣ Find existing payment history entry
      const existingPaymentEntryIndex = order.paymentHistory.findIndex(
        (entry) => entry.razorpayOrderId === orderData.razorpayOrderId
      );

      let updatePayload: any;

      if (!isAuthentic) {
        // ❌ Failed payment
        if (existingPaymentEntryIndex >= 0) {
          updatePayload = {
            $set: {
              [`paymentHistory.${existingPaymentEntryIndex}.paymentStatus`]:
                "failed",
              [`paymentHistory.${existingPaymentEntryIndex}.razorpayPaymentId`]:
                orderData.razorpayPaymentId,
              [`paymentHistory.${existingPaymentEntryIndex}.razorpaySignature`]:
                orderData.razorpaySignature,
              [`paymentHistory.${existingPaymentEntryIndex}.comment`]:
                "Payment verification failed - invalid signature",
              [`paymentHistory.${existingPaymentEntryIndex}.paymentDate`]:
                new Date(),
            },
            paymentStatus: "failed",
            status: "cancelled",
          };
        } else {
          updatePayload = {
            $push: {
              paymentHistory: {
                razorpayOrderId: orderData.razorpayOrderId,
                razorpayPaymentId: orderData.razorpayPaymentId,
                razorpaySignature: orderData.razorpaySignature,
                paymentStatus: "failed",
                paymentDate: new Date(),
                comment: "Payment verification failed - invalid signature",
              },
            },
            paymentStatus: "failed",
            status: "cancelled",
          };
        }

        await this.orderModel.findByIdAndUpdate(order._id, updatePayload, {
          session,
        });
        await session.commitTransaction();
        throw new AppError("Payment verification failed", HTTP.BAD_REQUEST);
      }

      // ✅ Successful payment
      if (existingPaymentEntryIndex >= 0) {
        updatePayload = {
          $set: {
            [`paymentHistory.${existingPaymentEntryIndex}.paymentStatus`]:
              "completed",
            [`paymentHistory.${existingPaymentEntryIndex}.razorpayPaymentId`]:
              orderData.razorpayPaymentId,
            [`paymentHistory.${existingPaymentEntryIndex}.razorpaySignature`]:
              orderData.razorpaySignature,
            [`paymentHistory.${existingPaymentEntryIndex}.comment`]:
              "Payment successfully verified",
            [`paymentHistory.${existingPaymentEntryIndex}.paymentDate`]:
              new Date(),
          },
          razorpayPaymentId: orderData.razorpayPaymentId,
          razorpaySignature: orderData.razorpaySignature,
          paymentStatus: "completed",
          status: "confirmed",
        };
      } else {
        updatePayload = {
          $push: {
            paymentHistory: {
              razorpayOrderId: orderData.razorpayOrderId,
              razorpayPaymentId: orderData.razorpayPaymentId,
              razorpaySignature: orderData.razorpaySignature,
              paymentStatus: "completed",
              paymentDate: new Date(),
              comment: "Payment successfully verified",
            },
          },
          razorpayPaymentId: orderData.razorpayPaymentId,
          razorpaySignature: orderData.razorpaySignature,
          paymentStatus: "completed",
          status: "confirmed",
        };
      }

      // 4️⃣ Update order
      const updatedOrder = await this.orderModel
        .findByIdAndUpdate(order._id, updatePayload, { new: true, session })
        .lean();

      // 5️⃣ Mark coupon as used after successful payment
      if (order.coupon && order.coupon._id) {
        await this.couponModel.findByIdAndUpdate(
          order.coupon._id,
          { $push: { usedBy: order.userId } },
          { session }
        );
      }

      // 6️⃣ Deduct brownie points ONLY after successful payment
      if (order.browniePointsUsed && order.browniePointsUsed > 0) {
        // a) Decrement user's total brownie points in User collection
        await this.userModel.findByIdAndUpdate(
          order.userId,
          { $inc: { browniePoints: -order.browniePointsUsed } },
          { session }
        );

        // b) Create a new entry in BrowniePoints collection
        await BrowniePointsModel.create(
          [
            {
              userId: order.userId, // ObjectId
              type: "spent",
              points: order.browniePointsUsed,
              orderId: order._id, // ObjectId
              createdAt: new Date(),
              comment: "Points spent for Razorpay order",
            },
          ],
          { session }
        );
      }

      await session.commitTransaction();

      return {
        message: "Payment verified and order confirmed successfully",
        status: HTTP.OK,
        success: true,
        data: updatedOrder,
      };
    } catch (error) {
      await session.abortTransaction();
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    } finally {
      session.endSession();
    }
  }

  async getUserOrders(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<ServiceResponse> {
    try {
      const skip = (page - 1) * limit;

      // Get orders + total count in parallel
      const [orders, total] = await Promise.all([
        this.orderModel
          .find({ userId })
          .populate("userId", "name email phone")
          .populate("items.productId", "name slug images")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        this.orderModel.countDocuments({ userId }),
      ]);

      // Pagination calculations
      const totalPages = Math.ceil(total / limit);

      return {
        data: {
          orders,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: total,
            itemsPerPage: limit,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
        message: "Orders fetched successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  getUserOrderById = async (
    userId: string,
    orderId: string
  ): Promise<ServiceResponse> => {
    try {
      if (!orderId || typeof orderId !== "string") {
        throw new AppError("Invalid order ID", HTTP.BAD_REQUEST);
      }

      // Find the order
      const order = await this.orderModel
        .findOne({ orderId, userId })
        .populate("userId", "name email phone")
        .populate(
          "items.productId",
          "name description slug images bannerImages"
        );

      if (!order) {
        throw new AppError("Order not found", HTTP.NOT_FOUND);
      }

      const orderData = order.toObject();

      return {
        data: orderData,
        message: "Order fetched successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  };

  async downloadInvoice(userId: string, orderId: string) {
    const order = await this.orderModel
      .findOne({ orderId, userId })
      .populate("userId", "name email phone")
      .lean(); // Using lean() for better performance since we don't need mongoose document methods

    if (!order) {
      throw new AppError("Order not found", HTTP.NOT_FOUND);
    }

    if (order.paymentStatus !== "completed") {
      throw new AppError(
        "Invoice can only be downloaded for completed orders",
        HTTP.BAD_REQUEST
      );
    }

    // Check if order status is confirmed (additional validation)
    if (order.status !== "confirmed") {
      throw new AppError(
        "Invoice can only be downloaded for confirmed orders",
        HTTP.BAD_REQUEST
      );
    }

    try {
      // Generate HTML for invoice
      const invoiceHTML = generateInvoiceHTML(order);

      // Launch browser and generate PDF
      const browser = await chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"], // For production environments
      });

      const page = await browser.newPage();

      // Set content and wait for fonts/images to load
      await page.setContent(invoiceHTML, {
        waitUntil: "networkidle",
        timeout: 30000, // 30 second timeout
      });

      // Generate PDF with optimized settings
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "10mm",
          right: "10mm",
          bottom: "10mm",
          left: "10mm",
        },
        displayHeaderFooter: false,
        preferCSSPageSize: true,
      });

      await browser.close();

      return {
        buffer: pdfBuffer,
        filename: `Chill-Deli-Invoice-${orderId}.pdf`,
        contentType: "application/pdf",
      };
    } catch (error) {
      console.error("Invoice generation error:", error);
      throw new AppError(
        "Failed to generate invoice. Please try again later.",
        HTTP.INTERNAL_SERVER_ERROR
      );
    }
  }
}
