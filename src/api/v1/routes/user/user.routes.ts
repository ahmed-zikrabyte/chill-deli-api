import express from "express";
import { protectUser } from "../../../../middleware/userAuth.middleware";
import userAuthRouter from "./auth.user.routes";
import userCouponRouter from "./coupon.user.routes";
import userProductRouter from "./product.user.routes";
import userReelRouter from "./reels.user.routes";
import userStoreRouter from "./store.user.routes";

const userRoutes: express.Router = express.Router();

// ===>  v1/admin/
userRoutes.use("/auth", userAuthRouter);

userRoutes.use(protectUser);

userRoutes.use("/products", userProductRouter);
userRoutes.use("/stores", userStoreRouter);
userRoutes.use("/reels", userReelRouter);
userRoutes.use("/coupons", userCouponRouter);

export default userRoutes;
