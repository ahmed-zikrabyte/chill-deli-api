import type { Request, Response } from "express";
import { catchAsync } from "../../../../utils/catch-async.util";
import { ApiResponse } from "../../../../utils/response.util";
import { UserAuthService } from "../../services/user/auth.user.service";

export default class AuthController {
  authService = new UserAuthService();

  /** LOGIN */
  login = catchAsync(async (req: Request, res: Response) => {
    const response = await this.authService.login({
      email: req.body.email,
      password: req.body.password,
    });

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  /** SEND OTP FOR REGISTRATION */
  sendRegistrationOtp = catchAsync(async (req: Request, res: Response) => {
    const { name, email, phone, password } = req.body;

    const response = await this.authService.sendRegistrationOtp({
      name,
      email,
      phone,
      password,
    });

    return ApiResponse.success({
      res,
      message: response.message,
      statusCode: response.status,
    });
  });

  /** VERIFY OTP AND COMPLETE REGISTRATION */
  verifyRegistrationOtp = catchAsync(async (req: Request, res: Response) => {
    const { otp, email } = req.body;

    const response = await this.authService.verifyRegistrationOtp(email, otp);

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  /** SEND OTP FOR FORGOT PASSWORD */
  sendForgotPasswordOtp = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;

    const response = await this.authService.sendForgotPasswordOtp(email);

    return ApiResponse.success({
      res,
      message: response.message,
      statusCode: response.status,
    });
  });

  /** VERIFY FORGOT PASSWORD OTP */
  verifyForgotPasswordOtp = catchAsync(async (req: Request, res: Response) => {
    const { email, otp } = req.body;

    const response = await this.authService.verifyForgotPasswordOtp(email, otp);

    return ApiResponse.success({
      res,
      message: response.message,
      statusCode: response.status,
    });
  });

  /** RESET PASSWORD */
  resetPassword = catchAsync(async (req: Request, res: Response) => {
    const { email, newPassword } = req.body;

    const response = await this.authService.resetPassword(email, newPassword);

    return ApiResponse.success({
      res,
      message: response.message,
      statusCode: response.status,
    });
  });

  /** GET USER DETAILS */
  getUserDetails = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    const response = await this.authService.getUserDetails(userId);

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  /** UPDATE USER DETAILS */
  updateUserDetails = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { name, phone } = req.body;

    const response = await this.authService.updateUserDetails(userId, {
      name,
      phone,
    });

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });
}
