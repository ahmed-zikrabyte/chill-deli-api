import mongoose, { type Document, Schema } from "mongoose";

export interface IUserReviewMetadata {
  hasUserReviewed: boolean;
  userReviewId?: string;
  hasPurchased: boolean;
}

export interface IReviewResponse {
  reviews: IReview[];
  ratings: { rating: number }[];
  counts: { 1: number; 2: number; 3: number; 4: number; 5: number };
  average: string | number;
  userMetadata?: IUserReviewMetadata;
}

export interface IReview extends Document {
  userId: mongoose.Types.ObjectId;
  reviewType: "product" | "store";
  product?: {
    productId: mongoose.Types.ObjectId;
    name: string;
    images: {
      url: string;
      contentType: string;
      filename: string;
    }[];
  };
  store?: {
    storeId: mongoose.Types.ObjectId;
    name: string;
    images: {
      url: string;
      contentType: string;
      filename: string;
    }[];
  };
  review: string;
  rating: number;
  approved: boolean;
  status: "hidden" | "visible";
}

const reviewSchema = new Schema<IReview>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    reviewType: {
      type: String,
      enum: ["product", "store"],
      required: true,
    },
    product: {
      productId: {
        type: Schema.Types.ObjectId,
        ref: "product",
      },
      name: String,
      images: [
        {
          url: String,
          contentType: String,
          filename: String,
        },
      ],
    },
    store: {
      storeId: {
        type: Schema.Types.ObjectId,
        ref: "store",
      },
      name: String,
      images: [
        {
          url: String,
          contentType: String,
          filename: String,
        },
      ],
    },
    review: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["hidden", "visible"],
      default: "hidden",
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    approved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const ReviewModel = mongoose.model<IReview>("Review", reviewSchema);
