import type { Request, Response } from "express";
import { HTTP } from "../../../../config/http-status.config";
import { catchAsync } from "../../../../utils/catch-async.util";
import { ApiResponse } from "../../../../utils/response.util";
import { ReviewUserService } from "../../services/user/reviews.user.service";

const reviewUserService = new ReviewUserService();

export class ReviewUserController {
  createReview = catchAsync(async (req: Request, res: Response) => {
    console.log(req.body);
    const { productId, review, rating } = req.body;
    const userId = req.user.id;

    const response = await reviewUserService.createReview(
      userId,
      productId,
      review,
      rating
    );
    return ApiResponse.success({
      res,
      message: "Review created successfully",
      data: response,
      statusCode: HTTP.OK,
    });
  });

  getReviewsByProductId = catchAsync(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const userId = req.user?._id; // Optional user context
    const response = await reviewUserService.getReviewsByProductId(
      productId,
      userId
    );
    return ApiResponse.success({
      res,
      message: "Reviews fetched successfully",
      data: response,
      statusCode: HTTP.OK,
    });
  });

  createStoreReview = catchAsync(async (req: Request, res: Response) => {
    const { storeId, review, rating } = req.body;
    const userId = req.user.id;

    const response = await reviewUserService.createStoreReview(
      userId,
      storeId,
      review,
      rating
    );
    return ApiResponse.success({
      res,
      message: "Store review created successfully",
      data: response,
      statusCode: HTTP.OK,
    });
  });

  getReviewsByStoreId = catchAsync(async (req: Request, res: Response) => {
    const { storeId } = req.params;
    const userId = req.user?._id; // Optional user context
    const response = await reviewUserService.getReviewsByStoreId(
      storeId,
      userId
    );
    return ApiResponse.success({
      res,
      message: "Store reviews fetched successfully",
      data: response,
      statusCode: HTTP.OK,
    });
  });
}
