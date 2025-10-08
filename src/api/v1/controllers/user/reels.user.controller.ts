import type { Request, Response } from "express";
import { catchAsync } from "../../../../utils/catch-async.util";
import { ApiResponse } from "../../../../utils/response.util";
import UserReelService from "../../services/user/reels.user.service";

export default class UserReelController {
  reelService = new UserReelService();

  // TOGGLE LIKE
  toggleLike = catchAsync(async (req: Request, res: Response) => {
    const { reelId } = req.params;
    const userId = req.user.id;

    console.log("Reel ID:", reelId);
    console.log("User ID:", userId);

    const response = await this.reelService.toggleLike(reelId, userId);

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  // ADD VIEW
  addView = catchAsync(async (req: Request, res: Response) => {
    const { reelId } = req.params;
    const userId = req.user.id;

    const response = await this.reelService.addView(reelId, userId);

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  // MARK AS FULLY WATCHED
  markAsFullyWatched = catchAsync(async (req: Request, res: Response) => {
    const { reelId } = req.params;
    const userId = req.user.id;

    const response = await this.reelService.markAsFullyWatched(reelId, userId);

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  // GET REEL BY ID
  getById = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const response = await this.reelService.getById(req.params.id, userId);
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
    const userId = req.user?.id;

    const response = await this.reelService.getAll(
      Number(page),
      Number(limit),
      isActive === "true" ? true : isActive === "false" ? false : undefined,
      (search as string) || undefined,
      userId
    );

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  // GET REEL STATS
  getReelStats = catchAsync(async (req: Request, res: Response) => {
    const { reelId } = req.params;

    const response = await this.reelService.getReelStats(reelId);

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });
}
