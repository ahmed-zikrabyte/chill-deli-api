import mongoose from "mongoose";
import { AppError } from "../../../../middleware/error.middleware";
import { CouponModel } from "../../../../models/coupon.model";

interface ApplyCouponInput {
  code: string;
  cartAmount?: number;
}

export class UserCouponService {
  private readonly couponModel = CouponModel;

  applyCoupon = async (
    { code, cartAmount }: ApplyCouponInput,
    userId: string
  ) => {
    if (!code) throw new AppError("Coupon code is required", 400);

    const coupon = await this.couponModel.findOne({
      code: code.toUpperCase(),
      isActive: true,
      isDeleted: false,
    });

    if (!coupon) throw new AppError("Invalid or inactive coupon", 400);

    const now = new Date();
    if (coupon.startDate > now)
      throw new AppError("Coupon is not active yet", 400);
    if (coupon.expiresAt < now) throw new AppError("Coupon has expired", 400);

    if (cartAmount !== undefined && cartAmount < coupon.minPurchaseAmount) {
      throw new AppError(
        `Minimum purchase amount for this coupon is ${coupon.minPurchaseAmount}`,
        400
      );
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    if (coupon.usedBy.some((id) => id.equals(userObjectId))) {
      throw new AppError("You have already used this coupon", 400);
    }

    const discountAmount = (cartAmount || 0) * (coupon.discountValue / 100);

    return {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      minPurchaseAmount: coupon.minPurchaseAmount,
      expiresAt: coupon.expiresAt,
    };
  };
}
