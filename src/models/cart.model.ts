import mongoose from "mongoose";
import { PRODUCT_DB_REF } from "./product.model";
import { USER_DB_REF } from "./user.model";

const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: PRODUCT_DB_REF,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
    },
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: USER_DB_REF,
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
  },
  {
    timestamps: true,
  }
);
export const CART_DB_REF = "carts";
export const Cart = mongoose.model(CART_DB_REF, cartSchema);
