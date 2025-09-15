import mongoose from "mongoose";
import { USER_DB_REF } from "./user.model";

export interface Address {
  userId: mongoose.Schema.Types.ObjectId;
  fullName: string;
  phone: string;
  pincode: string;
  state: string;
  district: string;
  house: string;
  area: string;
  landmark: string;
  addressType: string;
  isDefault: boolean;
}
export const addressSchema = new mongoose.Schema<Address>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: USER_DB_REF,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      match: /^[6-9]\d{9}$/,
    },
    pincode: {
      type: String,
      required: true,
      match: /^\d{6}$/,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    district: {
      type: String,
      required: true,
      trim: true,
    },
    house: {
      type: String,
      required: true,
      trim: true,
    },
    area: {
      type: String,
      required: true,
      trim: true,
    },
    landmark: {
      type: String,
      default: "",
      trim: true,
    },
    addressType: {
      type: String,
      enum: ["Home", "Work", "Other"],
      default: "Home",
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const ADDRESS_DB_REF = "addresses";
export const AddressModel = mongoose.model(ADDRESS_DB_REF, addressSchema);
