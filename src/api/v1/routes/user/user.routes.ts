import express from "express";
import { protectUser } from "../../../../middleware/userAuth.middleware";
import AuthController from "../../controllers/user/auth.user.controller";
import userAddressRoutes from "./address.user.route";
import userAuthRouter from "./auth.user.routes";
import bannerUserRoutes from "./banner.user.routes";
import cartUserRoutes from "./cart.user.route";
import userCouponRouter from "./coupon.user.routes";
import eventRouter from "./event.user.routes";
import orderUserRoutes from "./order.user.route";
import userProductRouter from "./product.user.routes";
import userReelRouter from "./reels.user.routes";
import reviewUserRoutes from "./review.user.route";
import userStoreRouter from "./store.user.routes";

const userRoutes: express.Router = express.Router();

// ===>  v1/user/
userRoutes.use("/auth", userAuthRouter);

// Protected routes
userRoutes.use(protectUser);

const authController = new AuthController();
userRoutes.get("/details", authController.getUserDetails);
userRoutes.patch("/details", authController.updateUserDetails);

userRoutes.use("/products", userProductRouter);
userRoutes.use("/stores", userStoreRouter);
userRoutes.use("/reels", userReelRouter);
userRoutes.use("/coupons", userCouponRouter);
userRoutes.use("/address", userAddressRoutes);
userRoutes.use("/banners", bannerUserRoutes);
userRoutes.use("/reviews", reviewUserRoutes);
userRoutes.use("/orders", orderUserRoutes);
userRoutes.use("/events", eventRouter);
userRoutes.use("/cart", cartUserRoutes);

export default userRoutes;
