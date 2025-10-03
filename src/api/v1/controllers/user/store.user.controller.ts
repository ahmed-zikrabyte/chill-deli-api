import type { Request, Response } from "express";
import { catchAsync } from "../../../../utils/catch-async.util";
import { ApiResponse } from "../../../../utils/response.util";
import UserStoreService from "../../services/user/store.user.service";

export default class UserStoreController {
  storeService = new UserStoreService();

  getById = catchAsync(async (req: Request, res: Response) => {
    const response = await this.storeService.getById(req.params.id);
    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  getAll = catchAsync(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, isActive, search } = req.query;

    const response = await this.storeService.getAll(
      Number(page),
      Number(limit),
      isActive === "true" ? true : isActive === "false" ? false : undefined,
      search as string
    );

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  getAllSortedByDistance = catchAsync(async (req: Request, res: Response) => {
    const { lat, long, page = 1, limit = 10, search } = req.query;

    if (!lat || !long) throw new Error("Latitude and longitude are required");

    const response = await this.storeService.getAllSortedByDistance(
      Number(lat),
      Number(long),
      Number(page),
      Number(limit)
    );

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });
}
