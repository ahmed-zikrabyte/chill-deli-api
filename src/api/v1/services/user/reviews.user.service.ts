import { HTTP } from "../../../../config/http-status.config";
import { AppError } from "../../../../middleware/error.middleware";
import { OrderModel } from "../../../../models/order.model";
import { ProductModel } from "../../../../models/product.model";
import {
  type IReviewResponse,
  type IUserReviewMetadata,
  ReviewModel,
} from "../../../../models/reviews.model";
import { StoreModel } from "../../../../models/store.model";

export class ReviewUserService {
  private readonly productModel = ProductModel;
  private readonly storeModel = StoreModel;
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
      reviewType: "product",
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

  getReviewsByProductId = async (
    productId: string,
    userId?: string
  ): Promise<IReviewResponse> => {
    if (!productId) {
      throw new AppError("Product ID is required", HTTP.BAD_REQUEST);
    }
    const reviews = await this.reviewModel
      .find({
        reviewType: "product",
        "product.productId": productId,
        status: "visible",
        approved: true,
      })
      .sort({ createdAt: -1 })
      .populate("userId", "-password");
    const ratings = await this.reviewModel.find(
      {
        reviewType: "product",
        "product.productId": productId,
        status: "visible",
        approved: true,
      },
      { rating: 1, _id: 0 }
    );

    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    ratings.forEach(({ rating }) => {
      counts[rating as keyof typeof counts] =
        (counts[rating as keyof typeof counts] || 0) + 1;
    });

    const total = ratings.reduce((sum, { rating }) => sum + rating, 0);
    const average =
      ratings.length > 0 ? (total / ratings.length).toFixed(1) : 0;

    let userMetadata: IUserReviewMetadata | undefined;
    if (userId) {
      const userReview = await this.reviewModel.findOne({
        userId,
        reviewType: "product",
        "product.productId": productId,
      });

      const purchaseCheck = await this.orderModel.findOne({
        userId,
        "items.productId": productId,
      });

      userMetadata = {
        hasUserReviewed: !!userReview,
        userReviewId: userReview?._id?.toString(),
        hasPurchased: !!purchaseCheck,
      };
    }

    return { reviews, ratings, counts, average, userMetadata };
  };

  private isProductPurchasedByUser = async (
    userId: string,
    productId: string
  ) => {
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
    return { isProductPurchased: !!check };
  };

  createStoreReview = async (
    userId: string,
    storeId: string,
    review: string,
    rating: number
  ) => {
    if (!userId || !storeId || !review || !rating) {
      throw new AppError("All fields are required", HTTP.BAD_REQUEST);
    }

    const store = await this.storeModel.findById(storeId);
    if (!store) {
      throw new AppError("Store not found", HTTP.NOT_FOUND);
    }

    const existingReview = await this.reviewModel.findOne({
      "store.storeId": storeId,
      userId,
    });

    if (existingReview) {
      throw new AppError("Review already exists", HTTP.BAD_REQUEST);
    }

    const newReview = await this.reviewModel.create({
      userId,
      reviewType: "store",
      store: {
        storeId,
        name: store.name,
        images: store.images || [],
      },
      review,
      rating,
    });

    return newReview;
  };

  getReviewsByStoreId = async (
    storeId: string,
    userId?: string
  ): Promise<IReviewResponse> => {
    if (!storeId) {
      throw new AppError("Store ID is required", HTTP.BAD_REQUEST);
    }
    const reviews = await this.reviewModel
      .find({
        reviewType: "store",
        "store.storeId": storeId,
        status: "visible",
        approved: true,
      })
      .sort({ createdAt: -1 })
      .populate("userId", "-password");
    const ratings = await this.reviewModel.find(
      {
        reviewType: "store",
        "store.storeId": storeId,
        status: "visible",
        approved: true,
      },
      { rating: 1, _id: 0 }
    );

    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    ratings.forEach(({ rating }) => {
      counts[rating as keyof typeof counts] =
        (counts[rating as keyof typeof counts] || 0) + 1;
    });

    const total = ratings.reduce((sum, { rating }) => sum + rating, 0);
    const average =
      ratings.length > 0 ? (total / ratings.length).toFixed(1) : 0;

    let userMetadata: IUserReviewMetadata | undefined;
    if (userId) {
      const userReview = await this.reviewModel.findOne({
        userId,
        reviewType: "store",
        "store.storeId": storeId,
      });

      userMetadata = {
        hasUserReviewed: !!userReview,
        userReviewId: userReview?._id?.toString(),
        hasPurchased: true, // Store reviews don't require purchase verification
      };
    }

    return { reviews, ratings, counts, average, userMetadata };
  };
}
