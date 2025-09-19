import type { Request, Response } from "express";
import { catchAsync } from "../../../../utils/catch-async.util";
import { ApiResponse } from "../../../../utils/response.util";
import ReelService from "../../services/admin/reel.admin.service";

export default class ReelController {
  reelService = new ReelService();

  // CREATE REEL
  create = catchAsync(async (req: Request, res: Response) => {
    const { title, subtitle } = req.body;

    let video: Express.Multer.File | undefined;
    let thumbnail: Express.Multer.File | undefined;

    if (
      req.files &&
      typeof req.files === "object" &&
      !Array.isArray(req.files)
    ) {
      video = (req.files.video as Express.Multer.File[])?.[0];
      thumbnail = (req.files.thumbnail as Express.Multer.File[])?.[0];
    } else if (req.file) {
      video = req.file; // fallback single file
    }

    const response = await this.reelService.createReel(title, subtitle, {
      video,
      thumbnail,
    });

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  // UPDATE REEL
  update = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, subtitle, isActive } = req.body;

    let video: Express.Multer.File | undefined;
    let thumbnail: Express.Multer.File | undefined;

    if (
      req.files &&
      typeof req.files === "object" &&
      !Array.isArray(req.files)
    ) {
      video = (req.files.video as Express.Multer.File[])?.[0];
      thumbnail = (req.files.thumbnail as Express.Multer.File[])?.[0];
    }

    const response = await this.reelService.updateReel(
      id,
      {
        title,
        subtitle,
        isActive:
          typeof isActive === "boolean"
            ? isActive
            : isActive === "true"
              ? true
              : isActive === "false"
                ? false
                : undefined,
      },
      { video, thumbnail }
    );

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  // SOFT DELETE REEL
  deleteById = catchAsync(async (req: Request, res: Response) => {
    const response = await this.reelService.deleteById(req.params.id);
    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  // TOGGLE REEL STATUS
  toggleStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isActive } = req.body;

    const response = await this.reelService.toggleStatusById(
      id,
      typeof isActive === "boolean" ? isActive : isActive === "true"
    );

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  // GET REEL BY ID
  getById = catchAsync(async (req: Request, res: Response) => {
    const response = await this.reelService.getById(req.params.id);
    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  // GET ALL REELS with pagination and filter
  getAll = catchAsync(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, isActive, search } = req.query;

    const response = await this.reelService.getAll(
      Number(page),
      Number(limit),
      isActive === "true" ? true : isActive === "false" ? false : undefined,
      (search as string) || undefined
    );

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });
}
