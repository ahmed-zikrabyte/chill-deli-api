import mongoose from "mongoose";

export interface IOtpData {
  name?: string;
  email: string;
  phone?: string;
  password?: string;
  otp: string;
  createdAt: Date;
  expiresAt: Date;
}

const otpSchema = new mongoose.Schema<IOtpData>({
  name: { type: String },
  email: { type: String, required: true, trim: true },
  phone: { type: String },
  password: { type: String },
  otp: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpModel = mongoose.model<IOtpData>("otp", otpSchema);
