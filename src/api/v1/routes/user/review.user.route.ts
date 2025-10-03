import express from "express";
import { ReviewUserController } from "../../controllers/user/review.user.controller";

const reviewUserRoutes: express.Router = express.Router();

const reviewUserController = new ReviewUserController();

reviewUserRoutes.get("/:productId", reviewUserController.getReviewsByProductId);
reviewUserRoutes.post("/", reviewUserController.createReview);
reviewUserRoutes.get(
  "/product/:productId",
  reviewUserController.isReviewAddedByUser
);
reviewUserRoutes.post(
  "/check/:productId",
  reviewUserController.isProductPurchasedByUser
);

export default reviewUserRoutes;
