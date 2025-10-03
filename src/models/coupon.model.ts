import mongoose from "mongoose";

export const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["percentage"],
      required: true,
      default: "percentage",
    },
    discountValue: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    minPurchaseAmount: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    usedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],
    slug: {
      type: String,
      required: true,
    },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const COUPON_DB_REF = "coupons";
export const CouponModel = mongoose.model(COUPON_DB_REF, couponSchema);
