import express from "express";
import ReviewAdminController from "../../controllers/admin/review.admin.controller";

const reviewAdminRoutes = express.Router();
const reviewAdminController = new ReviewAdminController();

reviewAdminRoutes.get("/", reviewAdminController.getReviews);
reviewAdminRoutes.put("/:id", reviewAdminController.toggleReview);
reviewAdminRoutes.put("/approve/:id", reviewAdminController.approveReview);

export default reviewAdminRoutes;
