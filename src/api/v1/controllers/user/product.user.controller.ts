/* biome-disable lint/complexity/useLiteralKeys */
import type { Request, Response } from "express";
import { catchAsync } from "../../../../utils/catch-async.util";
import { ApiResponse } from "../../../../utils/response.util";
import UserProductService from "../../services/user/product.user.service";

export default class UserProductController {
  productService = new UserProductService();

  // GET /products/:id
  getById = catchAsync(async (req: Request, res: Response) => {
    const response = await this.productService.getById(req.params.id);

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  // GET /products
  getAll = catchAsync(async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 10,
      status,
      isActive,
      search,
      deliveryStatus, // new filter
    } = req.query;

    const response = await this.productService.getAll(
      Number(page),
      Number(limit),
      status as string,
      isActive === "true" ? true : isActive === "false" ? false : undefined,
      search as string,
      deliveryStatus as string
    );

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  // GET /products/all (no pagination)
  getAllWithoutPagination = catchAsync(async (_req: Request, res: Response) => {
    const response = await this.productService.getAllWithoutPagination();

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });
}
