import express from "express";
import { protectUser } from "../../../../middleware/userAuth.middleware";
import userAddressRoutes from "./address.user.route";
import userAuthRouter from "./auth.user.routes";
import bannerUserRoutes from "./banner.user.routes";
import userCouponRouter from "./coupon.user.routes";
import orderUserRoutes from "./order.user.route";
import userProductRouter from "./product.user.routes";
import userReelRouter from "./reels.user.routes";
import reviewUserRoutes from "./review.user.route";
import userStoreRouter from "./store.user.routes";

const userRoutes: express.Router = express.Router();

// ===>  v1/admin/
userRoutes.use("/auth", userAuthRouter);

userRoutes.use(protectUser);

userRoutes.use("/products", userProductRouter);
userRoutes.use("/stores", userStoreRouter);
userRoutes.use("/reels", userReelRouter);
userRoutes.use("/coupons", userCouponRouter);
userRoutes.use("/address", userAddressRoutes);
userRoutes.use("/banners", bannerUserRoutes);
userRoutes.use("/reviews", reviewUserRoutes);
userRoutes.use("/orders", orderUserRoutes);

export default userRoutes;
