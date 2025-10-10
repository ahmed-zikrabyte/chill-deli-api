import crypto from "node:crypto";
import mongoose, { type Types } from "mongoose";
import { chromium } from "playwright";
import { HTTP } from "../../../../config/http-status.config";
import { AppError } from "../../../../middleware/error.middleware";
import { AddressModel } from "../../../../models/address.model";
import { BoxModel } from "../../../../models/box.model";
import { BrowniePointsModel } from "../../../../models/brownie-point.model";
import { Cart } from "../../../../models/cart.model";
import { CouponModel } from "../../../../models/coupon.model";
import { type Items, OrderModel } from "../../../../models/order.model";
import { ProductModel } from "../../../../models/product.model";
import { UserModel } from "../../../../models/user.model";
import type { ServiceResponse } from "../../../../typings";
import { generateOrderId } from "../../../../utils/generateOrderId";
import generateInvoiceMailTemplate from "../../../../utils/mail-templates/invoice-mail-template";
import { createOrder } from "../../../../utils/razorpay";
import assignAWB from "../../../../utils/shiprocket/assignAwb";
import { checkHyperlocalCourierAvailability } from "../../../../utils/shiprocket/courierAvailabilty";
import { createShiprocketOrder } from "../../../../utils/shiprocket/createOrder";

export class OrderUserService {
  private readonly orderModel = OrderModel;
  private readonly addressModel = AddressModel;
  private readonly userModel = UserModel;
  private readonly productModel = ProductModel;
  private readonly couponModel = CouponModel;
  private readonly boxModel = BoxModel;
  private readonly cartModel = Cart;

  private parseWeight(weight: string | number): number {
    if (typeof weight === "number") return weight;
    if (!weight) return 0;

    const weightStr = weight.toString().toLowerCase();
    const numMatch = weightStr.match(/([0-9.]+)/);
    if (!numMatch) return 0;

    const num = parseFloat(numMatch[1]);
    if (weightStr.includes("kg")) return num * 1000;
    return num; // assume grams if no unit
  }

  async calculateOrderSummary(
    userId: string,
    data: {
      cartId: string;
      addressId: string;
      couponCode?: string;
      browniePointsToUse?: number;
    }
  ): Promise<ServiceResponse> {
    try {
      const address = await this.addressModel.findOne({
        _id: data.addressId,
        userId,
      });
      if (!address) throw new AppError("Address not found", HTTP.NOT_FOUND);

      const cart = await this.cartModel.findById(data.cartId);
      if (!cart || cart.userId.toString() !== userId) {
        throw new AppError("Cart not found", HTTP.NOT_FOUND);
      }
      if (!cart.items.length) {
        throw new AppError("Cart is empty", HTTP.BAD_REQUEST);
      }

      // Calculate cart subtotal
      let subtotal = 0;
      const items = [];
      for (const item of cart.items) {
        const product = await this.productModel.findById(item.productId);
        if (!product) continue;
        const variant = product.variants.find(
          (v) => v._id?.toString() === item.variant.toString()
        );
        if (!variant) continue;

        const itemTotal = variant.price * item.quantity;
        subtotal += itemTotal;
        items.push({
          name: product.name,
          quantity: item.quantity,
          price: variant.price,
          total: itemTotal,
          weight: this.parseWeight(variant.weight),
        });
      }

      // Apply coupon discount
      let couponDiscount = 0;
      let couponDetails = null;
      if (data.couponCode) {
        const coupon = await this.couponModel.findOne({
          code: { $regex: `^${data.couponCode}$`, $options: "i" },
          isActive: true,
          isDeleted: false,
          startDate: { $lte: new Date() },
          expiresAt: { $gt: new Date() },
        });

        if (
          coupon &&
          !coupon.usedBy.includes(new mongoose.Types.ObjectId(userId)) &&
          subtotal >= coupon.minPurchaseAmount
        ) {
          couponDiscount =
            coupon.discountType === "percentage"
              ? (subtotal * coupon.discountValue) / 100
              : coupon.discountValue;
          couponDetails = {
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            discountAmount: couponDiscount,
          };
        }
      }

      // Apply brownie points
      const requestedPoints = data.browniePointsToUse
        ? Number(data.browniePointsToUse)
        : 0;
      let brownieDiscount = 0;
      if (requestedPoints > 0) {
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
        const availablePoints =
          (totalEarned[0]?.total || 0) - (totalSpent[0]?.total || 0);

        if (requestedPoints <= availablePoints) {
          brownieDiscount = Math.min(
            requestedPoints,
            subtotal - couponDiscount
          );
        }
      }

      const discountedAmount = subtotal - couponDiscount - brownieDiscount;

      // Auto-select box based on total item count
      const totalItemCount = items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      const box = await this.boxModel.findOne({
        "itemCountRange.min": { $lte: totalItemCount },
        "itemCountRange.max": { $gte: totalItemCount },
      });

      if (!box) {
        throw new AppError(
          "No suitable box found for the given item count",
          HTTP.BAD_REQUEST
        );
      }

      // Calculate GST based on state
      const gstRate = Number(process.env.COMPANY_GST || "18");
      const gstTax = (discountedAmount * gstRate) / 100;
      const businessState = process.env.COMPANY_STATE || "Karnataka";
      const customerState = address.state;

      let cgst = 0,
        sgst = 0,
        igst = 0;
      if (businessState.toLowerCase() === customerState.toLowerCase()) {
        // Intra-state: CGST + SGST
        cgst = gstTax / 2;
        sgst = gstTax / 2;
      } else {
        // Inter-state: IGST
        igst = gstTax;
      }

      const amountAfterGst = discountedAmount + gstTax;

      // Calculate delivery charge
      const totalWeight =
        items.reduce((sum, item) => sum + item.weight * item.quantity, 0) /
        1000;
      const deliveryRates = await checkHyperlocalCourierAvailability(
        address.pincode,
        address.latitude || 0,
        address.longitude || 0,
        totalWeight
      );

      if (!deliveryRates.status || !deliveryRates.data.length) {
        throw new AppError(
          "Delivery not available for this location",
          HTTP.BAD_REQUEST
        );
      }

      const deliveryCharge = deliveryRates.data[0].rates || 0;
      const finalTotal = amountAfterGst + deliveryCharge;

      return {
        data: {
          items,
          subtotal,
          couponDiscount,
          couponDetails,
          brownieDiscount,
          discountedAmount,
          box: {
            _id: box._id,
            label: box.label,
            itemCountRange: box.itemCountRange,
            totalItemCount,
          },
          gst: {
            rate: gstRate,
            cgst,
            sgst,
            igst,
            total: gstTax,
          },
          deliveryCharge,
          finalTotal: Math.round(finalTotal * 100) / 100,
        },
        message: "Order summary calculated successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  async createOrder(
    userId: string,
    orderData: {
      cartId: string;
      addressId: string;
      paymentMethod: "free" | "razorpay";
      couponCode?: string;
      browniePointsToUse?: number;
    }
  ): Promise<ServiceResponse> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await this.userModel.findById(userId).session(session);
      if (!user) throw new AppError("User not found", HTTP.NOT_FOUND);

      const address = await this.addressModel
        .findOne({ _id: orderData.addressId, userId })
        .session(session);
      if (!address) throw new AppError("Address not found", HTTP.NOT_FOUND);

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

      const requestedPoints = orderData.browniePointsToUse
        ? Number(orderData.browniePointsToUse)
        : 0;
      let browniePointsUsed = 0;
      let brownieDiscount = 0;

      if (requestedPoints > 0) {
        if (requestedPoints < 0)
          throw new AppError("Invalid brownie points value", HTTP.BAD_REQUEST);

        const earned = totalEarned[0]?.total || 0;
        const spent = totalSpent[0]?.total || 0;
        const availablePoints = earned - spent;

        if (requestedPoints > availablePoints)
          throw new AppError(
            `Insufficient brownie points. Requested ${requestedPoints}, available ${availablePoints}`,
            HTTP.BAD_REQUEST
          );

        browniePointsUsed = requestedPoints;
        brownieDiscount = browniePointsUsed;
      }

      // Get cart and validate
      const cart = await this.cartModel
        .findById(orderData.cartId)
        .session(session);
      if (!cart || cart.userId.toString() !== userId) {
        throw new AppError("Cart not found", HTTP.NOT_FOUND);
      }
      if (!cart.items.length) {
        throw new AppError("Cart is empty", HTTP.BAD_REQUEST);
      }

      const processedItems: any[] = [];
      let subtotal = 0;

      for (const item of cart.items) {
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
          (v) => v._id?.toString() === item.variant.toString()
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
            weight: this.parseWeight(variant.weight),
          },
          slug: product.slug,
          images: product.images,
          quantity: item.quantity,
          price: itemTotal,
        });
      }

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

      const discountedAmount = subtotal - discount;
      if (brownieDiscount > discountedAmount)
        throw new AppError(
          `Brownie points discount (₹${brownieDiscount}) cannot exceed amount after coupon (₹${discountedAmount})`,
          HTTP.BAD_REQUEST
        );

      const finalDiscountedAmount = discountedAmount - brownieDiscount;

      const gstRate = Number(process.env.COMPANY_GST || "18");
      const gstTax = (finalDiscountedAmount * gstRate) / 100;
      const businessState = process.env.COMPANY_STATE || "Karnataka";
      const customerState = address.state;

      let cgst = 0,
        sgst = 0,
        igst = 0;
      if (businessState.toLowerCase() === customerState.toLowerCase()) {
        // Intra-state: CGST + SGST
        cgst = gstTax / 2;
        sgst = gstTax / 2;
      } else {
        // Inter-state: IGST
        igst = gstTax;
      }

      const totalAmount = finalDiscountedAmount + gstTax;

      // Auto-select box based on total item count
      const totalItemCount = processedItems.reduce(
        (sum, i) => sum + i.quantity,
        0
      );
      const box = await this.boxModel
        .findOne({
          "itemCountRange.min": { $lte: totalItemCount },
          "itemCountRange.max": { $gte: totalItemCount },
        })
        .session(session);

      if (!box) {
        throw new AppError(
          "No suitable box found for the given item count",
          HTTP.BAD_REQUEST
        );
      }

      const totalWeight =
        processedItems.reduce(
          (sum, item) => sum + item.variant.weight * item.quantity,
          0
        ) / 1000;

      const deliveryRates = await checkHyperlocalCourierAvailability(
        address.pincode,
        address.latitude || 0,
        address.longitude || 0,
        totalWeight
      );

      if (!deliveryRates.status || !deliveryRates.data.length) {
        throw new AppError(
          "Hyperlocal delivery not available for this location",
          HTTP.BAD_REQUEST
        );
      }

      const courier = deliveryRates.data[0];
      const deliveryCharge = courier.rates || 0;
      const finalTotalAmount = totalAmount + deliveryCharge;

      const orderId = generateOrderId();
      let razorpayOrder = null;
      const paymentHistory: any[] = [];

      if (orderData.paymentMethod === "razorpay") {
        razorpayOrder = await createOrder(
          Math.round(finalTotalAmount || 0),
          orderId
        );
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
          igst,
          deliveryCharge,
          totalAmount: finalTotalAmount,
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
        browniePointsUsed,
        brownieDiscount,
        delivery: {
          courierName: courier.courier_name,
          deliveryCharge,
          etd: courier.etd,
          etdHours: courier.etd_hours,
          distance: courier.distance,
          status: "pending",
        },
      });

      await newOrder.save({ session });

      // For free orders, clear cart immediately since no payment verification needed
      if (orderData.paymentMethod === "free") {
        await this.cartModel
          .findByIdAndDelete(orderData.cartId)
          .session(session);
      }

      if (coupon) {
        coupon.usedBy.push(new mongoose.Types.ObjectId(userId));
        await coupon.save({ session });
      }

      if (orderData.paymentMethod === "free" && browniePointsUsed > 0) {
        await BrowniePointsModel.create(
          [
            {
              userId: new mongoose.Types.ObjectId(userId),
              points: browniePointsUsed,
              type: "spent",
              description: `Used in order ${orderId}`,
              orderId: newOrder._id,
            },
          ],
          { session }
        );
      }

      await session.commitTransaction();
      session.endSession();

      return {
        data: {
          order: newOrder.toObject(),
          razorpayOrder,
          deliveryInfo: {
            courierName: courier.courier_name,
            deliveryCharge,
            etd: courier.etd,
            etdHours: courier.etd_hours,
          },
        },
        message: "Order created successfully",
        status: HTTP.CREATED,
        success: true,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  async verifyPayment(paymentData: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    orderId: string;
  }): Promise<ServiceResponse> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const order = await this.orderModel
        .findOne({ orderId: paymentData.orderId })
        .session(session);

      if (!order) {
        throw new AppError("Order not found", HTTP.NOT_FOUND);
      }

      if (order.paymentStatus === "completed") {
        throw new AppError("Payment already verified", HTTP.BAD_REQUEST);
      }

      // Verify Razorpay signature
      const razorpaySecret = process.env.RAZOR_PAY_SECRET_KEY;
      if (!razorpaySecret) {
        throw new AppError(
          "Razorpay secret not configured",
          HTTP.INTERNAL_SERVER_ERROR
        );
      }

      const generatedSignature = crypto
        .createHmac("sha256", razorpaySecret)
        .update(
          `${paymentData.razorpayOrderId}|${paymentData.razorpayPaymentId}`
        )
        .digest("hex");

      if (generatedSignature !== paymentData.razorpaySignature) {
        throw new AppError("Invalid payment signature", HTTP.UNAUTHORIZED);
      }

      // Update order status
      order.paymentStatus = "completed";
      order.status = "confirmed";
      order.razorpayPaymentId = paymentData.razorpayPaymentId;
      order.paymentHistory.push({
        paymentStatus: "completed",
        paymentDate: new Date(),
        comment: "Payment verified successfully",
        razorpayPaymentId: paymentData.razorpayPaymentId,
      });

      // ✅ NOW CREATE SHIPROCKET ORDER AFTER PAYMENT CONFIRMED
      try {
        const user = await this.userModel
          .findById(order.userId)
          .session(session);
        if (!user) throw new Error("User not found");

        const nameParts = (user.name || "Customer Customer").split(" ");
        const firstName = nameParts[0] || "Customer";
        const lastName = nameParts.slice(1).join(" ") || "Customer";

        const shiprocketOrderData = {
          order_id: order.orderId,
          order_date: new Date().toISOString().slice(0, 16).replace("T", " "),
          pickup_location: "Test",
          billing_customer_name: firstName,
          billing_last_name: lastName,
          billing_address: `${order.address.house}, ${order.address.area}`,
          billing_city: order.address.city,
          billing_pincode: Number(order.address.pincode),
          billing_state: order.address.state,
          billing_country: "India",
          billing_email: user.email,
          billing_phone: Number(user.phone),
          shipping_is_billing: true,
          latitude: order.address.latitude || 0,
          longitude: order.address.longitude || 0,
          order_items: order.items.map((item) => ({
            name: item.name,
            sku: item.productId.toString(),
            units: parseInt(item.quantity.toString()),
            selling_price: parseFloat(item.variant.price.toString()),
          })),
          sub_total: order.totalAmount.totalAmount,
          length: order.box?.length || 15,
          breadth: order.box?.breadth || 15,
          height: order.box?.height || 15,
          weight: Math.max(
            0.5,
            (order.items.reduce(
              (sum, item) => sum + item.variant.weight * item.quantity,
              0
            ) +
              (order.box?.weight || 0)) /
              1000
          ),
        };

        console.log(
          "🚀 Creating Shiprocket order with data:",
          JSON.stringify(shiprocketOrderData, null, 2)
        );

        const shiprocketResponse =
          await createShiprocketOrder(shiprocketOrderData);

        console.log("📦 Shiprocket response:", shiprocketResponse);

        if (shiprocketResponse?.order_id && order.delivery) {
          order.delivery.shiprocketOrderId = shiprocketResponse.order_id;
          order.delivery.shipmentId = shiprocketResponse.shipment_id;
          order.delivery.status = "confirmed";
          console.log(
            `✅ Shiprocket order created - OrderID: ${shiprocketResponse.order_id}, ShipmentID: ${shiprocketResponse.shipment_id}`
          );

          // Assign AWB after successful order creation
          try {
            const awbResponse = await assignAWB(shiprocketResponse.shipment_id);
            if (awbResponse?.awb_code && order.delivery) {
              order.delivery.awbCode = awbResponse.awb_code;
              order.delivery.courierCompanyId = awbResponse.courier_company_id;
              order.delivery.assignedDateTime = awbResponse.assigned_date_time;
              order.delivery.awbStatus = "assigned";
              console.log(`📋 AWB assigned: ${awbResponse.awb_code}`);
            }
          } catch (awbError: any) {
            console.error("❌ AWB assignment failed:", {
              orderId: order.orderId,
              shipmentId: shiprocketResponse.shipment_id,
              error: awbError.message,
              response: awbError.response?.data,
            });

            // Keep AWB status as pending - admin will assign manually later
            console.log(
              "📋 AWB assignment pending - Admin intervention needed"
            );
          }
        }
      } catch (shiprocketError: any) {
        console.error("❌ Shiprocket order creation failed after payment:", {
          orderId: order.orderId,
          message: shiprocketError.message,
          response: shiprocketError.response?.data,
          errors: shiprocketError.response?.data?.errors,
          status: shiprocketError.response?.status,
          stack: shiprocketError.stack,
        });

        // Check if it's a wallet/payment issue
        const isWalletIssue =
          shiprocketError.response?.data?.message
            ?.toLowerCase()
            .includes("wallet") ||
          shiprocketError.response?.data?.message
            ?.toLowerCase()
            .includes("insufficient") ||
          shiprocketError.response?.data?.message
            ?.toLowerCase()
            .includes("balance");

        const errorComment = isWalletIssue
          ? `Shiprocket wallet insufficient - Manual order creation required: ${shiprocketError.message}`
          : `Shiprocket order creation failed: ${shiprocketError.message}`;

        order.paymentHistory.push({
          paymentStatus: "completed",
          paymentDate: new Date(),
          comment: errorComment,
        });

        console.log(
          isWalletIssue
            ? "💰 Wallet issue detected - Admin intervention needed"
            : "⚠️ General Shiprocket error"
        );

        // Don't throw - payment was successful, Shiprocket is secondary
        // You can create a manual process to retry failed Shiprocket orders
      }

      // Clear cart after successful payment verification
      await this.cartModel
        .findOneAndDelete({ userId: order.userId })
        .session(session);

      // Deduct brownie points
      if (order.browniePointsUsed && order.browniePointsUsed > 0) {
        await BrowniePointsModel.create(
          [
            {
              userId: order.userId,
              points: order.browniePointsUsed,
              type: "spent",
              description: `Used in order ${order.orderId}`,
              orderId: order._id,
            },
          ],
          { session }
        );
      }

      await order.save({ session });
      await session.commitTransaction();
      session.endSession();

      return {
        data: order.toObject(),
        message: "Payment verified successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  async getUserOrders(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<ServiceResponse> {
    try {
      const skip = (page - 1) * limit;

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
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  async getUserOrderById(
    userId: string,
    orderId: string
  ): Promise<ServiceResponse> {
    try {
      if (!orderId || typeof orderId !== "string") {
        throw new AppError("Invalid order ID", HTTP.BAD_REQUEST);
      }

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

      return {
        data: order.toObject(),
        message: "Order fetched successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  async downloadInvoice(userId: string, orderId: string) {
    const order = await this.orderModel
      .findOne({ orderId, userId })
      .populate("userId", "name email phone")
      .lean();

    if (!order) {
      throw new AppError("Order not found", HTTP.NOT_FOUND);
    }

    if (order.paymentStatus !== "completed") {
      throw new AppError(
        "Invoice can only be downloaded for completed orders",
        HTTP.BAD_REQUEST
      );
    }

    if (order.status !== "confirmed") {
      throw new AppError(
        "Invoice can only be downloaded for confirmed orders",
        HTTP.BAD_REQUEST
      );
    }

    try {
      const invoiceData = {
        orderId: order.orderId,
        createdAt: order.createdAt.toISOString(),
        items: order.items,
        address: order.address,
        paymentMethod: order.paymentMethod,
        subtotal: order.items.reduce(
          (sum: number, item: any) => sum + item.price,
          0
        ),
        discount: order.coupon?.discountAmount || 0,
        discountedAmount: order.totalAmount.amount,
        cgst: order.totalAmount.cgst,
        sgst: order.totalAmount.sgst,
        igst: order.totalAmount.igst,
        finalTotal: order.totalAmount.totalAmount,
        coupon: order.coupon,
      };
      const invoiceHTML = generateInvoiceMailTemplate(invoiceData);

      const browser = await chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();

      await page.setContent(invoiceHTML, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

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
      throw new AppError(
        "Failed to generate invoice. Please try again later.",
        HTTP.INTERNAL_SERVER_ERROR
      );
    }
  }
}
