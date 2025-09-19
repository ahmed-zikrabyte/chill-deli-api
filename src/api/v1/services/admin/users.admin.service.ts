import { HTTP } from "../../../../config/http-status.config";
import { AppError } from "../../../../middleware/error.middleware";
import { UserModel } from "../../../../models/user.model";

class UsersAdminService {
  private readonly userModel = UserModel;

  // ✅ Get all users with pagination + search
  getAllUsers = async (
    pagination: { search?: string; page?: number; limit?: number } = {}
  ) => {
    try {
      const { search = "", page = 1, limit = 5 } = pagination;
      const query: any = {};

      if (search?.trim()) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }

      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        this.userModel
          .find(query)
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 }),
        this.userModel.countDocuments(query), // ✅ count only filtered docs
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: users,
        pagination: {
          totalItems: total,
          totalPages,
          currentPage: page,
          pageSize: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  };

  // ✅ Toggle `isActive` instead of non-existent `status`
  toggleStatus = async (userId: string) => {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) throw new AppError("User not found", HTTP.NOT_FOUND);

      // flip isActive boolean
      user.isActive = !user.isActive;
      await user.save();

      return {
        data: user,
        message: `User ${user.isActive ? "activated" : "deactivated"} successfully`,
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  };
}

export default UsersAdminService;
