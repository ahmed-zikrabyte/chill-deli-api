import type { Request, Response } from "express";
import { HTTP } from "../../../../config/http-status.config";
import { catchAsync } from "../../../../utils/catch-async.util";
import { ApiResponse } from "../../../../utils/response.util";
import BannerAdminService from "../../services/admin/banner.admin.service";

const bannerAdminService = new BannerAdminService();

export class BannerAdminController {
  createBanner = catchAsync(async (req: Request, res: Response) => {
    const image = req.file as Express.Multer.File;
    const response = await bannerAdminService.createBanner(image);

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.statusCode,
    });
  });

  listBanners = catchAsync(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const response = await bannerAdminService.listBanners(page, limit);

    return ApiResponse.success({
      res,
      message: "Banners fetched successfully",
      data: response,
      statusCode: HTTP.OK,
    });
  });

  updateBanner = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const image = req.file as Express.Multer.File | undefined;

    const response = await bannerAdminService.updateBanner(id, image);

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.statusCode,
    });
  });

  toggleBannerStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const response = await bannerAdminService.toggleBannerStatus(id);

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.statusCode,
    });
  });

  deleteBanner = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const response = await bannerAdminService.deleteBanner(id);

    return ApiResponse.success({
      res,
      message: response.message,
      statusCode: response.statusCode,
    });
  });
}
