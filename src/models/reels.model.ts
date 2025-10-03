import mongoose, { type Document, Schema } from "mongoose";

export interface IReel extends Document {
  video: {
    url: string;
    filename: string;
    contentType: string;
  };
  thumbnail: {
    url: string;
    filename: string;
    contentType: string;
  };
  title: string;
  subtitle?: string;
  likes: mongoose.Types.ObjectId[];
  views: mongoose.Types.ObjectId[];
  fullyWatched: mongoose.Types.ObjectId[];
  isActive: boolean;
  isDeleted: boolean;
}

const reelSchema = new Schema<IReel>(
  {
    video: {
      url: { type: String, required: true },
      filename: { type: String, required: true },
      contentType: { type: String, required: true },
    },
    thumbnail: {
      url: { type: String, required: true },
      filename: { type: String, required: true },
      contentType: { type: String, required: true },
    },
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "user",
      },
    ],
    views: [
      {
        type: Schema.Types.ObjectId,
        ref: "user",
      },
    ],
    fullyWatched: [
      {
        type: Schema.Types.ObjectId,
        ref: "user",
      },
    ],

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const REEL_DB_REF = "reel";
export const ReelModel = mongoose.model<IReel>(REEL_DB_REF, reelSchema);
