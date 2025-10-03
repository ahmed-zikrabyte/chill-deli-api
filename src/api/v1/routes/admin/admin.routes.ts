import express from "express";
import { protectSuperAdmin } from "../../../../middleware/adminAuth.middleware";
import adminAuthRouter from "./auth.admin.routes";
import bannerAdminRoutes from "./banner.admin.routes";
import boxRouter from "./box.admin.routes";
import couponRouter from "./coupon.admin.routes";
import eventRouter from "./event.admin.routes";
import orderAdminRouter from "./order.admin.routes";
import productRouter from "./product.admin.routes";
import reelRouter from "./reel.admin.routes";
import reviewAdminRoutes from "./review.admin.routes";
import storeRouter from "./store.admin.routes";
import usersAdminRouter from "./users.admin.routes";

const adminRoutes: express.Router = express.Router();

// ===>  v1/admin/
adminRoutes.use("/auth", adminAuthRouter);

adminRoutes.use(protectSuperAdmin);

adminRoutes.use("/products", productRouter);
adminRoutes.use("/stores", storeRouter);
adminRoutes.use("/users", usersAdminRouter);
adminRoutes.use("/reels", reelRouter);
adminRoutes.use("/coupons", couponRouter);
adminRoutes.use("/boxes", boxRouter);
adminRoutes.use("/banners", bannerAdminRoutes);
adminRoutes.use("/reviews", reviewAdminRoutes);
adminRoutes.use("/orders", orderAdminRouter);
adminRoutes.use("/events", eventRouter);

export default adminRoutes;
