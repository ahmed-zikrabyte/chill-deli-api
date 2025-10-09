import mongoose from "mongoose";
import { HTTP } from "../../../../config/http-status.config";
import { AppError } from "../../../../middleware/error.middleware";
import { ProductModel } from "../../../../models/product.model";
import type { ServiceResponse } from "../../../../typings";

export default class UserProductService {
  private readonly productModel = ProductModel;

  // Get Product by ID
  async getById(id: string): Promise<ServiceResponse> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError("Invalid product ID", HTTP.BAD_REQUEST);
      }

      const query = this.productModel.findById(id).where({ isDeleted: false });

      const product = await query;

      if (!product) {
        throw new AppError("Product not found", HTTP.NOT_FOUND);
      }

      return {
        data: product,
        message: "Product fetched successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  // Get All Products with Pagination & Filters
  async getAll(
    page: number = 1,
    limit: number = 10,
    status?: string, // 'in-stock' | 'out-of-stock'
    isActive?: boolean,
    search?: string,
    deliveryStatus?: string // 'available-for-delivery' | 'not-available-for-delivery'
  ): Promise<ServiceResponse> {
    try {
      const query: Record<string, any> = { isDeleted: false };

      // Filter by stock status
      if (status && ["in-stock", "out-of-stock"].includes(status)) {
        query.stockStatus = status;
      }

      // Filter by active status
      if (typeof isActive === "boolean") {
        query.isActive = isActive;
      }

      // Filter by delivery status
      if (
        deliveryStatus &&
        ["available-for-delivery", "not-available-for-delivery"].includes(
          deliveryStatus
        )
      ) {
        query.deliveryStatus = deliveryStatus;
      }

      // Search by product name/title
      if (search && search.trim() !== "") {
        query.name = { $regex: search.trim(), $options: "i" }; // case-insensitive
      }

      const skip = (page - 1) * limit;

      // Build query
      const productsQuery = this.productModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Execute query & count total
      const [products, total] = await Promise.all([
        productsQuery,
        this.productModel.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: {
          products,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: total,
            itemsPerPage: limit,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
        message: "Products fetched successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  // Get All Active Products Without Pagination
  async getAllWithoutPagination(): Promise<ServiceResponse> {
    try {
      const products = await this.productModel
        .find({
          isDeleted: false,
          isActive: true,
        })
        .sort({ createdAt: -1 });

      return {
        data: { products },
        message: "All active products fetched successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  // Get All Products Available for Delivery
  async getAvailableForDelivery(
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<ServiceResponse> {
    try {
      const query: Record<string, any> = {
        isDeleted: false,
        deliveryStatus: "available-for-delivery",
      };

      if (search && search.trim() !== "") {
        query.name = { $regex: search.trim(), $options: "i" };
      }

      const skip = (page - 1) * limit;

      const [products, total] = await Promise.all([
        this.productModel
          .find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        this.productModel.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: {
          products,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: total,
            itemsPerPage: limit,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
        message: "Products available for delivery fetched successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }
}
