import mongoose from "mongoose";

export interface IStore {
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  images: {
    url: string;
    filename: string;
    contentType: string;
  }[];
  contact: string;
  products: mongoose.Types.ObjectId[];
  isActive: boolean;
  isDeleted: boolean;
}

const storeSchema = new mongoose.Schema<IStore>(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    images: [
      {
        url: String,
        filename: String,
        contentType: String,
      },
    ],
    contact: { type: String, trim: true },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
      },
    ],

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const STORE_DB_REF = "store";
export const StoreModel = mongoose.model<IStore>(STORE_DB_REF, storeSchema);
