import mongoose from "mongoose";

export interface IBanner {
  image: {
    url: string;
    filename: string;
    contentType: string;
  };
  isActive: boolean;
}

const bannerSchema = new mongoose.Schema<IBanner>(
  {
    image: {
      url: { type: String, required: true },
      filename: { type: String, required: true },
      contentType: { type: String, required: true },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const BANNER_DB_REF = "banners";
export const BannerModel = mongoose.model(BANNER_DB_REF, bannerSchema);
