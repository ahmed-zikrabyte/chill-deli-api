import mongoose, { type Document, Schema } from "mongoose";

interface IReview extends Document {
  userId: mongoose.Types.ObjectId;
  product: {
    productId: mongoose.Types.ObjectId;
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
    product: {
      productId: {
        type: Schema.Types.ObjectId,
        ref: "product",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      images: [
        {
          url: { type: String, required: true },
          contentType: { type: String, required: true },
          filename: { type: String, required: true },
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
