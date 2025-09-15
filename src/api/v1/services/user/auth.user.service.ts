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

    const otpToSend = await generateOTP();
    // const otpToSend = "123456";
    const hashedOtp = await bcrypt.hash(otpToSend, 10);

    const hashedPassword = password ? hashPassword(password) : undefined;

    const record = await this.otpModel.findOne({ email });
    if (record) {
      record.otp = hashedOtp;
      record.expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      if (hashedPassword) record.password = hashedPassword;
      if (name) record.name = name;
      if (phone) record.phone = phone;
      await record.save();
    } else {
      await this.otpModel.create({
        name,
        email,
        phone,
        password: hashedPassword,
        otp: hashedOtp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      });
    }

    const mailTemplate = generateOtpVerifyMailTemplate(email, otpToSend);
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
      .findOne({ email })
      .sort({ createdAt: -1 });
    if (!record) throw new AppError("OTP not found or expired", HTTP.NOT_FOUND);

    const isValid = await bcrypt.compare(userOtp, record.otp);
    if (!isValid) throw new AppError("Invalid OTP", HTTP.BAD_REQUEST);

    const newUser = await this.userModel.create({
      name: record.name,
      email: record.email,
      phone: record.phone,
      password: record.password,
      role: "user",
    });

    await this.otpModel.deleteMany({ email });

    const mailTemplate = generateWelcomeMailTemplate(record.name!);
    await this.smsProvider.sendSms({
      to: email,
      name: record.name!,
      subject: "Welcome to Chill Deli",
      htmlContent: mailTemplate,
    });

    const payload = { id: newUser._id.toString(), role: newUser.role };
    const token = generateUserToken(payload);

    return {
      message: "Registration successful",
      status: HTTP.CREATED,
      success: true,
      data: { token, user: newUser },
    };
  }
}
