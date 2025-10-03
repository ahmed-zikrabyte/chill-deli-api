import express from "express";
import multer from "multer";
import { BannerAdminController } from "../../controllers/admin/banner.admin.controller";

const upload = multer({ storage: multer.memoryStorage() });
const bannerAdminRoutes = express.Router();
const bannerAdminController = new BannerAdminController();

// Create Banner
bannerAdminRoutes.post(
  "/",
  upload.single("image"),
  bannerAdminController.createBanner
);

// List Banners with pagination
bannerAdminRoutes.get("/", bannerAdminController.listBanners);

// Update Banner
bannerAdminRoutes.put(
  "/:id",
  upload.single("image"),
  bannerAdminController.updateBanner
);

// Toggle Banner Status
bannerAdminRoutes.patch(
  "/toggle/:id",
  bannerAdminController.toggleBannerStatus
);

// Delete Banner
bannerAdminRoutes.delete("/:id", bannerAdminController.deleteBanner);

export default bannerAdminRoutes;
