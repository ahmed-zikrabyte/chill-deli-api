import mongoose from "mongoose";

export interface IStore {
  name: string;
  description?: string;
  address: string;
  location: {
    map: string;
    lat: number;
    lng: number;
  };
  contact: {
    name: string;
    email: string;
    phone: string;
    profilePicture?: {
      url: string;
      filename: string;
      contentType: string;
    };
  };
  openingHours?: {
    monday?: { open: string; close: string };
    tuesday?: { open: string; close: string };
    wednesday?: { open: string; close: string };
    thursday?: { open: string; close: string };
    friday?: { open: string; close: string };
    saturday?: { open: string; close: string };
    sunday?: { open: string; close: string };
  };
  images?: {
    url: string;
    filename: string;
    contentType: string;
  }[];
  gallery?: {
    url: string;
    filename: string;
    contentType: string;
  }[];
  products?: mongoose.Types.ObjectId[];
  slug: string;
  isActive: boolean;
  isDeleted: boolean;
}

const storeSchema = new mongoose.Schema<IStore>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    address: { type: String, required: true, trim: true },

    location: {
      map: { type: String, required: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    contact: {
      name: { type: String, trim: true },
      email: { type: String, trim: true },
      phone: { type: String, trim: true },
      profilePicture: {
        url: String,
        filename: String,
        contentType: String,
      },
    },
    openingHours: {
      monday: { open: String, close: String },
      tuesday: { open: String, close: String },
      wednesday: { open: String, close: String },
      thursday: { open: String, close: String },
      friday: { open: String, close: String },
      saturday: { open: String, close: String },
      sunday: { open: String, close: String },
    },
    images: [
      {
        url: String,
        filename: String,
        contentType: String,
      },
    ],
    gallery: [
      {
        url: String,
        filename: String,
        contentType: String,
      },
    ],
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
      },
    ],
    slug: { type: String, required: true, trim: true, unique: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const STORE_DB_REF = "store";
export const StoreModel = mongoose.model<IStore>(STORE_DB_REF, storeSchema);
