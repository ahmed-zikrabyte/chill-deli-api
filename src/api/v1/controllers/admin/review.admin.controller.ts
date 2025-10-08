import type { Request, Response } from "express";
import { HTTP } from "../../../../config/http-status.config";
import { catchAsync } from "../../../../utils/catch-async.util";
import { ApiResponse } from "../../../../utils/response.util";
import ReviewAdminService from "../../services/admin/review.admin.service";

const reviewAdminService = new ReviewAdminService();

class ReviewAdminController {
  getReviews = catchAsync(async (req: Request, res: Response) => {
    const { page, limit, reviewType } = req.query;
    const response = await reviewAdminService.getAllReviews(
      Number(page || 1),
      Number(limit || 10),
      reviewType as "product" | "store" | undefined
    );
    return ApiResponse.success({
      res,
      message: `${reviewType ? `${reviewType} r` : "R"}eviews fetched successfully`,
      data: response,
      statusCode: HTTP.OK,
    });
  });

  toggleReview = catchAsync(async (req: Request, res: Response) => {
    const reviewId = req.params.id;
    const response = await reviewAdminService.toggleReviewStatus(reviewId);
    return ApiResponse.success({
      res,
      message: "Review toggled successfully",
      data: response,
      statusCode: HTTP.OK,
    });
  });

  approveReview = catchAsync(async (req: Request, res: Response) => {
    const reviewId = req.params.id;
    const response = await reviewAdminService.approveReview(reviewId);
    return ApiResponse.success({
      res,
      message: "Review approved successfully",
      data: response,
      statusCode: HTTP.OK,
    });
  });
}

export default ReviewAdminController;
