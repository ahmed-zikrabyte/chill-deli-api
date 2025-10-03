import type { Request, Response } from "express";
import { HTTP } from "../../../../config/http-status.config";
import { catchAsync } from "../../../../utils/catch-async.util";
import { ApiResponse } from "../../../../utils/response.util";
import UsersAdminService from "../../services/admin/users.admin.service";

const usersAdminService = new UsersAdminService();

export class UsersAdminController {
  getAllUsers = catchAsync(async (req: Request, res: Response) => {
    const { page, limit, search } = req.query;

    const response = await usersAdminService.getAllUsers({
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      search: (search as string) ?? "",
    });

    return ApiResponse.success({
      res,
      message: "Users fetched successfully",
      data: {
        users: response.data,
        pagination: response.pagination,
      },
      statusCode: HTTP.OK,
    });
  });

  toggleUserStatus = catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.id;
    const response = await usersAdminService.toggleStatus(userId);

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: HTTP.OK,
    });
  });
}
