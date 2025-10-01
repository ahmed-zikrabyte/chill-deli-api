import bcrypt from "bcryptjs";
import { ENV } from "../../../../config/env";
import { HTTP } from "../../../../config/http-status.config";
import { AppError } from "../../../../middleware/error.middleware";
import { OtpModel } from "../../../../models/otp.model";
import { UserModel } from "../../../../models/user.model";
import type { ServiceResponse } from "../../../../typings";
import { hashPassword } from "../../../../utils/auth.util";
import generateOtpVerifyMailTemplate from "../../../../utils/mail-templates/otp-verify-mail-template";
import generateWelcomeMailTemplate from "../../../../utils/mail-templates/welcome-mail-template";
import generateOTP, { generateUserToken } from "../../../../utils/text.utils";
import { BrevoSmsProvider } from "../sms/brevo.provider";

interface UserLoginParams {
  email: string;
  password: string;
}

export class UserAuthService {
  private readonly userModel = UserModel;
  private readonly otpModel = OtpModel;
  private readonly smsProvider = new BrevoSmsProvider({
    apiKey: ENV.email.brevo.apiKey!,
  });

  /** LOGIN */
  async login(params: UserLoginParams): ServiceResponse {
    const user = await this.userModel.findOne({ email: params.email });
    if (!user) throw new AppError("User not found", HTTP.NOT_FOUND);

    const isPasswordMatched = await user.comparePassword(params.password);
    if (!isPasswordMatched)
      throw new AppError("Invalid credentials", HTTP.UNAUTHORIZED);

    const payload = { id: user._id.toString(), role: user.role };
    const token = generateUserToken(payload);

    return {
      data: { token, user },
      message: "Login successful",
      status: HTTP.OK,
      success: true,
    };
  }

  /** SEND OTP FOR REGISTRATION */
  async sendRegistrationOtp(params: {
    name?: string;
    email: string;
    phone?: string;
    password?: string;
  }): ServiceResponse {
    const { name, email, phone, password } = params;

    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) throw new AppError("User already exists", HTTP.CONFLICT);

    if (phone) {
      const existingPhone = await this.userModel.findOne({ phone });
      if (existingPhone)
        throw new AppError("Phone number already registered", HTTP.CONFLICT);
    }

    const otpToSend = await generateOTP();
    // ⚠️ Storing plain OTP (not hashed)
    // const otpToSend = "123456";
    const plainOtp = otpToSend;

    const hashedPassword = password ? hashPassword(password) : undefined;

    let record = await this.otpModel.findOne({ email });
    if (record) {
      record.otp = plainOtp;
      record.expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      if (hashedPassword) record.password = hashedPassword;
      if (name) record.name = name;
      if (phone) record.phone = phone;
      await record.save();
    } else {
      record = await this.otpModel.create({
        name,
        email,
        phone,
        password: hashedPassword,
        otp: plainOtp, // save directly
        type: "registration",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      });
    }

    const mailTemplate = generateOtpVerifyMailTemplate(
      name || record?.name || "User",
      otpToSend
    );
    await this.smsProvider.sendSms({
      to: email,
      name: name || record?.name!,
      subject: record ? "Verify OTP (Resent)" : "Verify OTP",
      htmlContent: mailTemplate,
    });

    return {
      message: record ? "OTP resent successfully" : "OTP sent successfully",
      status: HTTP.OK,
      success: true,
    };
  }

  /** VERIFY OTP AND COMPLETE REGISTRATION */
  async verifyRegistrationOtp(email: string, userOtp: string): ServiceResponse {
    const record = await this.otpModel
      .findOne({ email, type: "registration" })
      .sort({ createdAt: -1 });
    if (!record) throw new AppError("OTP not found or expired", HTTP.NOT_FOUND);

    if (userOtp !== record.otp)
      throw new AppError("Invalid OTP", HTTP.BAD_REQUEST);

    const newUser = await this.userModel.create({
      name: record.name,
      email: record.email,
      phone: record.phone,
      password: record.password,
      role: "user",
    });

    await this.otpModel.deleteMany({ email });

    console.log(
      "🎉 User registered successfully, sending welcome email to:",
      email
    );
    try {
      console.log("📧 Generating welcome email template for:", record.name);
      const mailTemplate = generateWelcomeMailTemplate(record.name!);
      console.log("📤 Sending welcome email via Brevo...");

      await this.smsProvider.sendSms({
        to: email,
        name: record.name!,
        subject: "Welcome to Chill Deli",
        htmlContent: mailTemplate,
      });

      console.log("✅ Welcome email sent successfully to:", email);
    } catch (emailError) {
      console.error("❌ Welcome email failed to send:", emailError);
      console.error("Error details:", JSON.stringify(emailError, null, 2));
      // Don't throw error - registration should still succeed
    }

    const payload = { id: newUser._id.toString(), role: newUser.role };
    const token = generateUserToken(payload);

    return {
      message: "Registration successful",
      status: HTTP.CREATED,
      success: true,
      data: { token, user: newUser },
    };
  }

  /** SEND OTP FOR FORGOT PASSWORD */
  async sendForgotPasswordOtp(email: string): ServiceResponse {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new AppError("User not found", HTTP.NOT_FOUND);

    const otpToSend = await generateOTP();
    const plainOtp = otpToSend;

    let record = await this.otpModel.findOne({
      email,
      type: "forgot-password",
    });
    if (record) {
      record.otp = plainOtp;
      record.expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      await record.save();
    } else {
      record = await this.otpModel.create({
        email,
        name: user.name,
        otp: plainOtp,
        type: "forgot-password",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      });
    }

    const mailTemplate = generateOtpVerifyMailTemplate(user.name, otpToSend);
    await this.smsProvider.sendSms({
      to: email,
      name: user.name,
      subject: record
        ? "Reset Password - OTP (Resent)"
        : "Reset Password - OTP Verification",
      htmlContent: mailTemplate,
    });

    return {
      message: record
        ? "Password reset OTP resent successfully"
        : "Password reset OTP sent successfully",
      status: HTTP.OK,
      success: true,
    };
  }

  /** VERIFY FORGOT PASSWORD OTP */
  async verifyForgotPasswordOtp(
    email: string,
    userOtp: string
  ): ServiceResponse {
    const record = await this.otpModel
      .findOne({ email, type: "forgot-password" })
      .sort({ createdAt: -1 });
    if (!record) throw new AppError("OTP not found or expired", HTTP.NOT_FOUND);

    if (userOtp !== record.otp)
      throw new AppError("Invalid OTP", HTTP.BAD_REQUEST);

    return {
      message: "OTP verified successfully. You can now reset your password.",
      status: HTTP.OK,
      success: true,
    };
  }

  /** RESET PASSWORD */
  async resetPassword(email: string, newPassword: string): ServiceResponse {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new AppError("User not found", HTTP.NOT_FOUND);

    const hashedPassword = hashPassword(newPassword);
    await this.userModel.updateOne({ email }, { password: hashedPassword });
    await this.otpModel.deleteMany({ email, type: "forgot-password" });

    return {
      message: "Password reset successfully",
      status: HTTP.OK,
      success: true,
    };
  }

  /** GET USER DETAILS */
  async getUserDetails(userId: string): ServiceResponse {
    const user = await this.userModel.findById(userId).select("-password");
    if (!user) throw new AppError("User not found", HTTP.NOT_FOUND);

    return {
      data: { user },
      message: "User details retrieved successfully",
      status: HTTP.OK,
      success: true,
    };
  }

  /** UPDATE USER DETAILS */
  async updateUserDetails(
    userId: string,
    updates: { name?: string; phone?: string }
  ): ServiceResponse {
    const user = await this.userModel.findById(userId);
    if (!user) throw new AppError("User not found", HTTP.NOT_FOUND);

    if (updates.phone) {
      const existingPhone = await this.userModel.findOne({
        phone: updates.phone,
        _id: { $ne: userId },
      });
      if (existingPhone)
        throw new AppError("Phone number already in use", HTTP.CONFLICT);
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, updates, { new: true })
      .select("-password");

    return {
      data: { user: updatedUser },
      message: "User details updated successfully",
      status: HTTP.OK,
      success: true,
    };
  }
}
