import mongoose from "mongoose";

export interface Address {
  userId: mongoose.Schema.Types.ObjectId;
  name: string;
  phone: string;
  house: string;
  area: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  addressType: "Home" | "Work" | "Other";
  isDefault: boolean;
}

export const addressSchema = new mongoose.Schema<Address>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, match: /^[6-9]\d{9}$/ },
    house: { type: String, trim: true, required: true },
    area: { type: String, trim: true, required: true },
    landmark: { type: String, trim: true, default: "" },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, match: /^\d{6}$/ },
    latitude: { type: Number },
    longitude: { type: Number },
    addressType: {
      type: String,
      enum: ["Home", "Work", "Other"],
      default: "Home",
    },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const ADDRESS_DB_REF = "addresses";
export const AddressModel = mongoose.model(ADDRESS_DB_REF, addressSchema);
