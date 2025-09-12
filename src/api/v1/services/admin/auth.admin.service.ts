import jwt, { type SignOptions } from "jsonwebtoken";
import type { Types } from "mongoose";
import { ENV } from "../../../../config/env";
import { HTTP } from "../../../../config/http-status.config";
import { AppError } from "../../../../middleware/error.middleware";
import { AdminModel } from "../../../../models/admin.model";
import type { ServiceResponse } from "../../../../typings";

export default class AdminAuthService {
  async register({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<ServiceResponse> {
    const existing = await AdminModel.findOne({ email });
    if (existing) throw new AppError("Admin already exists", 400);

    const admin = await AdminModel.create({ email, password });

    const adminId = (admin._id as Types.ObjectId).toString();
    const token = this.generateToken(adminId);

    return {
      data: {
        token,
        admin: { id: adminId, email: admin.email, role: admin.role },
      },
      message: "Admin registered successfully",
      status: HTTP.CREATED,
      success: true,
    };
  }

  async login({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<ServiceResponse> {
    const admin = await AdminModel.findOne({ email }).select("+password");
    if (!admin) throw new AppError("Invalid credentials", HTTP.UNAUTHORIZED);

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) throw new AppError("Invalid credentials", HTTP.UNAUTHORIZED);

    const adminId = (admin._id as Types.ObjectId).toString();
    const token = this.generateToken(adminId);

    return {
      data: {
        token,
        admin: { id: adminId, email: admin.email, role: admin.role },
      },
      message: "Login successful",
      status: HTTP.OK,
      success: true,
    };
  }

  private generateToken(adminId: string): string {
    if (!ENV.jwt.secret) throw new Error("JWT secret not defined");
    const payload = { id: adminId, type: "admin" };
    const options: SignOptions = { expiresIn: ENV.jwt.expiresIn || "7d" };
    return jwt.sign(payload, ENV.jwt.secret as jwt.Secret, options);
  }
}
