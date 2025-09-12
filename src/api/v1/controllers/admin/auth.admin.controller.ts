import type { Request, Response } from "express";
import { catchAsync } from "../../../../utils/catch-async.util";
import { ApiResponse } from "../../../../utils/response.util";
import AdminAuthService from "../../services/admin/auth.admin.service";

export default class AdminAuthController {
  private service = new AdminAuthService();

  register = catchAsync(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const response = await this.service.register({ email, password });
    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  login = catchAsync(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const response = await this.service.login({ email, password });
    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });
}
