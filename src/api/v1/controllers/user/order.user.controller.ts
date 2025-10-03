import type { Request, Response } from "express";
import { HTTP } from "../../../../config/http-status.config";
import { catchAsync } from "../../../../utils/catch-async.util";
import { ApiResponse } from "../../../../utils/response.util";
import { OrderUserService } from "../../services/user/order.user.service";

const orderUserService = new OrderUserService();

export class OrderUserController {
  // Create a new order
  createOrder = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const {
      items,
      addressId,
      paymentMethod,
      couponCode,
      boxId,
      browniePointsToUse,
    } = req.body;

    const orderData = {
      items,
      addressId,
      paymentMethod,
      couponCode,
      boxId,
      browniePointsToUse,
    };

    const response = await orderUserService.createOrder(userId, orderData);

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  // Verify payment for an order
  verifyPayment = catchAsync(async (req: Request, res: Response) => {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } =
      req.body;

    const paymentData = {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      orderId,
    };

    const response = await orderUserService.verifyPayment(paymentData);

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  // Get user orders with pagination
  getUserOrders = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const response = await orderUserService.getUserOrders(userId, page, limit);

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  // Get single user order by orderId
  getUserOrderById = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { orderId } = req.params;

    // call service
    const order = await orderUserService.getUserOrderById(userId, orderId);

    // send response
    return ApiResponse.success({
      res,
      message: "Order fetched successfully",
      data: order,
      statusCode: HTTP.OK,
    });
  });

  // Download invoice for an order
  downloadInvoice = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { orderId } = req.body;

    const invoiceData = await orderUserService.downloadInvoice(userId, orderId);

    // Set headers for PDF download
    res.setHeader("Content-Type", invoiceData.contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${invoiceData.filename}"`
    );
    res.setHeader("Content-Length", invoiceData.buffer.length);

    // Send the PDF buffer
    res.send(invoiceData.buffer);
  });
}
