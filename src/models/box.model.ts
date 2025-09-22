import mongoose from "mongoose";

export const boxSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true, // e.g., "Small Box", "Medium Box"
      trim: true,
    },
    length: {
      type: Number,
      required: true, // cm
    },
    breadth: {
      type: Number,
      required: true, // cm
    },
    height: {
      type: Number,
      required: true, // cm
    },
    boxWeight: {
      type: Number,
      required: true, // kg - empty box weight
    },
    itemCountRange: {
      min: {
        type: Number,
        required: true,
        // min: 1,
      },
      max: {
        type: Number,
        required: true,
        // max: 3,
      },
    },
  },
  {
    timestamps: true,
  }
);

export const BOX_DB_REF = "box";
export const BoxModel = mongoose.model(BOX_DB_REF, boxSchema);
