import bcryptjs from "bcryptjs";
import mongoose from "mongoose";

export type TUserRole = "user";

export interface IUser {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: TUserRole;
  profileImage?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  isActive?: boolean;
  browniePoints: number;
  comparePassword: (password: string) => Promise<boolean>;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    name: { type: String, required: false, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    phone: {
      type: String,
      required: false,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user"],
      default: "user",
    },
    browniePoints: { type: Number, default: 0 },
    profileImage: { type: String, required: false },
    resetPasswordToken: { type: String, required: false },
    resetPasswordExpires: { type: Date, required: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  return await bcryptjs.compare(password, this.password);
};

export const USER_DB_REF = "user";
export const UserModel = mongoose.model(USER_DB_REF, userSchema);
