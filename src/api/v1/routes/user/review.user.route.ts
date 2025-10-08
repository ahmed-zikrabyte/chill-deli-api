import express from "express";
import { ReviewUserController } from "../../controllers/user/review.user.controller";

const reviewUserRoutes: express.Router = express.Router();

const reviewUserController = new ReviewUserController();

// Product review routes
reviewUserRoutes.get(
  "/product/:productId",
  reviewUserController.getReviewsByProductId
);
reviewUserRoutes.post("/product", reviewUserController.createReview);

// Store review routes
reviewUserRoutes.get(
  "/store/:storeId",
  reviewUserController.getReviewsByStoreId
);
reviewUserRoutes.post("/store", reviewUserController.createStoreReview);

export default reviewUserRoutes;
