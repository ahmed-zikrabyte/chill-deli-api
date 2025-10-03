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

  getAllSortedByDistance = async (
    userLat: number,
    userLng: number,
    page: number = 1,
    limit: number = 10
  ): Promise<ServiceResponse> => {
    try {
      if (isNaN(userLat) || isNaN(userLng)) {
        throw new AppError("Invalid coordinates", HTTP.BAD_REQUEST);
      }

      // Fetch all active, non-deleted stores
      const stores = await this.storeModel
        .find({ isActive: true, isDeleted: false })
        .populate("products");

      // Calculate distance for each store
      const storesWithDistance = stores.map((store) => {
        const R = 6371; // Earth radius in km
        const dLat = ((store.location.lat - userLat) * Math.PI) / 180;
        const dLng = ((store.location.lng - userLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((userLat * Math.PI) / 180) *
            Math.cos((store.location.lat * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return { ...store.toObject(), distance };
      });

      // Sort by distance
      storesWithDistance.sort((a, b) => a.distance - b.distance);

      // Apply pagination
      const total = storesWithDistance.length;
      const totalPages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      const paginatedStores = storesWithDistance.slice(start, start + limit);

      return {
        data: {
          stores: paginatedStores,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: total,
            itemsPerPage: limit,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
        message: "Stores fetched successfully, sorted by distance",
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
