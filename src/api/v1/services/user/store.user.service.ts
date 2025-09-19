import mongoose from "mongoose";
import { HTTP } from "../../../../config/http-status.config";
import { AppError } from "../../../../middleware/error.middleware";
import { StoreModel } from "../../../../models/store.model";
import type { ServiceResponse } from "../../../../typings";

export default class UserStoreService {
  private readonly storeModel = StoreModel;

  // === GET STORE BY ID ===
  getById = async (id: string): Promise<ServiceResponse> => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id))
        throw new AppError("Invalid store ID", HTTP.BAD_REQUEST);

      const store = await this.storeModel
        .findById(id)
        .where({ isDeleted: false })
        .populate("products");

      if (!store) throw new AppError("Store not found", HTTP.NOT_FOUND);

      return {
        data: store,
        message: "Store fetched successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  };

  // === GET ALL STORES ===
  getAll = async (
    page: number = 1,
    limit: number = 10,
    isActive?: boolean,
    search?: string
  ): Promise<ServiceResponse> => {
    try {
      const query: Record<string, any> = { isDeleted: false };

      if (typeof isActive === "boolean") query.isActive = isActive;

      if (search && search.trim() !== "") {
        query.name = { $regex: search.trim(), $options: "i" };
      }

      const skip = (page - 1) * limit;

      const [stores, total] = await Promise.all([
        this.storeModel
          .find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("products"),
        this.storeModel.countDocuments(query),
      ]);

      return {
        data: {
          stores,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: limit,
            hasNext: page * limit < total,
            hasPrev: page > 1,
          },
        },
        message: "Stores fetched successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  };
}
