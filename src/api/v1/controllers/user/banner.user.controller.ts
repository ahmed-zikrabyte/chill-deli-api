// controllers/user/banner.user.controller.ts
import type { Request, Response } from "express";
import { HTTP } from "../../../../config/http-status.config";
import { catchAsync } from "../../../../utils/catch-async.util";
import { ApiResponse } from "../../../../utils/response.util";
import { BannerUserService } from "../../../v1/services/user/banner.user.service";

export class BannerUserController {
  private bannerUserService = new BannerUserService();

  listBanners = catchAsync(async (_req: Request, res: Response) => {
    const banners = await this.bannerUserService.getActiveBanners();

    return ApiResponse.success({
      res,
      message: "Banners fetched successfully",
      data: banners,
      statusCode: HTTP.OK,
    });
  });
}
