// routes/user/banner.user.routes.ts
import express from "express";
import { BannerUserController } from "../../controllers/user/banner.user.controller";

const bannerUserRoutes = express.Router();
const bannerUserController = new BannerUserController();

// GET all active banner images
bannerUserRoutes.get("/", bannerUserController.listBanners);

export default bannerUserRoutes;
