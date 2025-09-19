import type { Request, Response } from "express";
import { catchAsync } from "../../../../utils/catch-async.util";
import { ApiResponse } from "../../../../utils/response.util";
import { UserCouponService } from "../../services/user/coupon.service";

const couponUserService = new UserCouponService();

export class UserCouponController {
  applyCoupon = catchAsync(async (req: Request, res: Response) => {
    const { code, cartAmount } = req.body;
    const userId = req.user.id; // get userId from token

    console.log("Coupon Code:", code);
    console.log("Cart Amount:", cartAmount);
    console.log("User ID:", userId);

    const response = await couponUserService.applyCoupon(
      { code, cartAmount }, // first argument: input object
      userId // second argument: userId
    );

    return ApiResponse.success({
      res,
      data: response,
      message: "Coupon applied successfully",
      statusCode: 200,
    });
  });
}
