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
}
