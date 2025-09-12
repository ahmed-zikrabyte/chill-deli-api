import type { Request, Response } from "express";
import { catchAsync } from "../../../../utils/catch-async.util";
import { ApiResponse } from "../../../../utils/response.util";
import PublicService from "../../services/public/public.service";
export default class PublicController {
  publicService = new PublicService();

  findTermsAndConditions = catchAsync(async (_req: Request, res: Response) => {
    const response = await this.publicService.findTermsAndConditions();

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });
}
