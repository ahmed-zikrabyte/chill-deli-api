import type { Request, Response } from "express";
import { HTTP } from "../../../../config/http-status.config";
import { catchAsync } from "../../../../utils/catch-async.util";
import { ApiResponse } from "../../../../utils/response.util";
import OrderAdminService from "../../services/admin/order.admin.service";

const orderAdminService = new OrderAdminService();

class OrderAdminController {
  getAllOrders = catchAsync(async (req: Request, res: Response) => {
    const filters = {
      startDate: (req.query.startDate as string) || "",
      endDate: (req.query.endDate as string) || "",
      status: (req.query.status as string) || "",
      paymentStatus: (req.query.paymentStatus as string) || "",
      paymentMethod: (req.query.paymentMethod as string) || "",
      searchTerm: (req.query.search as string) || "",
    };

    const pagination = {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
    };

    const orders = await orderAdminService.getAllOrders(filters, pagination);

    return ApiResponse.success({
      res,
      data: {
        orders: orders.data,
        pagination: orders.pagination,
      },
      message: "Orders retrieved successfully",
      statusCode: HTTP.OK,
    });
  });

  getOrderById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      return ApiResponse.error({
        res,
        message: "Order ID is required",
        statusCode: HTTP.BAD_REQUEST,
      });
    }

    const order = await orderAdminService.getOrderById(id);

    return ApiResponse.success({
      res,
      data: { order },
      message: "Order retrieved successfully",
      statusCode: HTTP.OK,
    });
  });

  exportOrderToExcel = catchAsync(async (req: Request, res: Response) => {
    const filters = {
      startDate: (req.query.startDate as string) || "",
      endDate: (req.query.endDate as string) || "",
      status: (req.query.status as string) || "",
      paymentStatus: (req.query.paymentStatus as string) || "",
      paymentMethod: (req.query.paymentMethod as string) || "",
      searchTerm: (req.query.search as string) || "",
    };

    // Remove empty filters
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== "")
    );

    const buffer = await orderAdminService.exportOrderToExcel(
      Object.keys(cleanFilters).length > 0 ? cleanFilters : undefined
    );

    // Generate filename with current date and applied filters
    const timestamp = new Date().toISOString().split("T")[0];
    let filename = `orders_${timestamp}`;

    if (cleanFilters.status && cleanFilters.status !== "all") {
      filename += `_${cleanFilters.status}`;
    }
    if (cleanFilters.paymentStatus && cleanFilters.paymentStatus !== "all") {
      filename += `_${cleanFilters.paymentStatus}`;
    }

    filename += ".xlsx";

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.send(buffer);
  });
}

export default OrderAdminController;
