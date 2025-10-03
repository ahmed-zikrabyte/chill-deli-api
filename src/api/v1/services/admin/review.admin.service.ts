import { HTTP } from "../../../../config/http-status.config";
import { AppError } from "../../../../middleware/error.middleware";
import { ReviewModel } from "../../../../models/reviews.model";

class ReviewAdminService {
  private readonly reviewModel = ReviewModel;

  getAllReviews = async (page = 1, limit = 10) => {
    try {
      const skip = (page - 1) * limit;

      const [reviews, totalReviews] = await Promise.all([
        this.reviewModel
          .find()
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("userId"),
        this.reviewModel.countDocuments(),
      ]);

      const totalPages = limit > 0 ? Math.ceil(totalReviews / limit) : 0;

      return {
        reviews,
        currentPage: page,
        totalPages,
        totalReviews,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to fetch reviews", HTTP.INTERNAL_SERVER_ERROR);
    }
  };

  toggleReviewStatus = async (reviewId: string) => {
    try {
      const review = await this.reviewModel.findById(reviewId);
      if (!review) throw new AppError("Review not found", HTTP.NOT_FOUND);
      review.status = review.status === "visible" ? "hidden" : "visible";
      await review.save();
      return review;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        "Failed to toggle review status",
        HTTP.INTERNAL_SERVER_ERROR
      );
    }
  };

  approveReview = async (reviewId: string) => {
    try {
      const review = await this.reviewModel.findById(reviewId);
      if (!review) {
        throw new AppError("Review not found", HTTP.NOT_FOUND);
      }
      review.approved = true;
      review.status = "visible";
      await review.save();
      return review;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        "Failed to approve review",
        HTTP.INTERNAL_SERVER_ERROR
      );
    }
  };
}

export default ReviewAdminService;
