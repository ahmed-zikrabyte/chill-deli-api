import mongoose, { Schema } from "mongoose";

export interface IProduct {
  name: string;
  description: string;
  price: number;
  images: {
    url: string;
    filename: string;
    contentType: string;
  }[];
  slug: string;
  status: string;
  isActive: boolean;
  isDeleted: boolean;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    images: [
      {
        url: String,
        filename: String,
        contentType: String,
      },
    ],
    slug: { type: String, required: true },
    status: {
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
