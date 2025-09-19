import express from "express";
import { UserCouponController } from "../../controllers/user/coupon.user.controller";

const userCouponRouter: express.Router = express.Router();

const couponUserController = new UserCouponController();

userCouponRouter.post("/apply", couponUserController.applyCoupon);

export default userCouponRouter;
