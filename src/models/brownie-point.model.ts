import mongoose, { type Document, Schema, type Types } from "mongoose";

export interface IBrowniePoints extends Document {
  userId: Types.ObjectId;
  type: "earned" | "spent";
  points: number;
  reelId?: Types.ObjectId;
  orderId?: Types.ObjectId;
  comment?: string;
  createdAt: Date;
}

const BrowniePointsSchema = new Schema<IBrowniePoints>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["earned", "spent"], required: true },
    points: { type: Number, required: true },
    reelId: { type: Schema.Types.ObjectId, ref: "Reel" },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    comment: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export const BROWNIE_POINT_DB_REF = "brownie_points";
export const BrowniePointsModel = mongoose.model<IBrowniePoints>(
  BROWNIE_POINT_DB_REF,
  BrowniePointsSchema
);
