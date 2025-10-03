import { HTTP } from "../../../../config/http-status.config";
import { AppError } from "../../../../middleware/error.middleware";
import { OrderModel } from "../../../../models/order.model";
import { ProductModel } from "../../../../models/product.model";
import { ReviewModel } from "../../../../models/reviews.model";

export class ReviewUserService {
  private readonly productModel = ProductModel;
  private readonly orderModel = OrderModel;
  private readonly reviewModel = ReviewModel;

  createReview = async (
    userId: string,
    productId: string,
    review: string,
    rating: number
  ) => {
    if (!userId || !productId || !review || !rating) {
      throw new AppError("All fields are required", HTTP.BAD_REQUEST);
    }

    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new AppError("Product not found", HTTP.NOT_FOUND);
    }

    // Check if user purchased the product
    const { isProductPurchased } = await this.isProductPurchasedByUser(
      userId,
      productId
    );
    if (!isProductPurchased) {
      throw new AppError(
        "You can only review products you have purchased",
        HTTP.FORBIDDEN
      );
    }

    const existingReview = await this.reviewModel.findOne({
      "product.productId": productId,
      userId,
    });

    if (existingReview) {
      throw new AppError("Review already exists", HTTP.BAD_REQUEST);
    }

    const newReview = await this.reviewModel.create({
      userId,
      product: {
        productId,
        name: product.name,
        images: product.images,
      },
      review,
      rating,
    });

    return newReview;
  };

  getReviewsByProductId = async (productId: string) => {
    if (!productId) {
      throw new AppError("Product ID is required", HTTP.BAD_REQUEST);
    }
    const reviews = await this.reviewModel
      .find({
        // productId: "product.productId",
        "product.productId": productId,
        status: "visible",
        approved: true,
      })
      .sort({ createdAt: -1 })
      .populate("userId", "-password");
    const ratings = await this.reviewModel.find(
      {
        "product.productId": productId,
        status: "visible",
        approved: true,
      },
      { rating: 1, _id: 0 }
    );
    console.log({ ratings });
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    ratings.forEach(({ rating }) => {
      counts[rating as keyof typeof counts] =
        (counts[rating as keyof typeof counts] || 0) + 1;
    });

    // Step 2: Calculate average
    const total = ratings.reduce((sum, { rating }) => sum + rating, 0);
    const average =
      ratings.length > 0 ? (total / ratings.length).toFixed(1) : 0;
    return { reviews, ratings, counts, average };
  };

  isReviewAddedByUser = async (userId: string, productId: string) => {
    if (!userId || !productId) {
      throw new AppError(
        "User ID and Product ID are required",
        HTTP.BAD_REQUEST
      );
    }
    const review = await this.reviewModel.findOne({
      userId,
      "product.productId": productId,
    });
    if (!review) {
      return { isReviewAdded: false };
    }
    return { isReviewAdded: true };
  };

  isProductPurchasedByUser = async (userId: string, productId: string) => {
    if (!userId || !productId) {
      throw new AppError(
        "User ID and Product ID is required",
        HTTP.BAD_REQUEST
      );
    }
    const check = await this.orderModel.findOne({
      userId,
      "items.productId": productId,
    });
    if (check) {
      return { isProductPurchased: true };
    }
    return { isProductPurchased: false };
  };
}
