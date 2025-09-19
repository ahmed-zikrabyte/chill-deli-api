import mongoose, { Schema } from "mongoose";

export interface IProduct {
  name: string;
  description: string;
  bannerImages: {
    url: string;
    filename: string;
    contentType: string;
  }[];
  images: {
    url: string;
    filename: string;
    contentType: string;
  }[];
  variants: {
    price: number;
    weight: string;
  }[];
  slug: string;
  deliveryStatus: "available-for-delivery" | "not-available-for-delivery";
  stockStatus: "in-stock" | "out-of-stock";
  isActive: boolean;
  isDeleted: boolean;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    bannerImages: [
      {
        url: String,
        filename: String,
        contentType: String,
      },
    ],
    images: [
      {
        url: String,
        filename: String,
        contentType: String,
      },
    ],
    variants: [
      {
        price: { type: Number, required: true },
        weight: { type: String, required: true },
      },
    ],
    slug: { type: String, required: true, trim: true, unique: true },
    deliveryStatus: {
      type: String,
      enum: ["available-for-delivery", "not-available-for-delivery"],
      default: "available-for-delivery",
    },
    stockStatus: {
      type: String,
      enum: ["in-stock", "out-of-stock"],
      default: "in-stock",
    },

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const PRODUCT_DB_REF = "product";
export const ProductModel = mongoose.model<IProduct>(
  PRODUCT_DB_REF,
  productSchema
);
