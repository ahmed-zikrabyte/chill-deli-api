import type { Request, Response } from "express";
import { catchAsync } from "../../../../utils/catch-async.util";
import { ApiResponse } from "../../../../utils/response.util";
import BoxService from "../../services/admin/box.admin.service";

const boxService = new BoxService();

export class BoxController {
  createBox = catchAsync(async (req: Request, res: Response) => {
    const response = await boxService.createBox(req.body);

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  getBoxes = catchAsync(async (req: Request, res: Response) => {
    const response = await boxService.listBoxes(
      Number(req.query.page),
      Number(req.query.limit)
    );

    return ApiResponse.success({
      res,
      message: response.message,
      data: {
        boxes: response.data,
        pagination: response.pagination,
      },
      statusCode: response.status,
    });
  });

  getBoxById = catchAsync(async (req: Request, res: Response) => {
    const response = await boxService.getBoxById(req.params.id);

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  updateBox = catchAsync(async (req: Request, res: Response) => {
    const response = await boxService.updateBox(req.params.id, req.body);

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  deleteBox = catchAsync(async (req: Request, res: Response) => {
    const response = await boxService.deleteBox(req.params.id);

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });
}
