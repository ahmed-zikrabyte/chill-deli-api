import mongoose from "mongoose";
import { HTTP } from "../../../../config/http-status.config";
import { AppError } from "../../../../middleware/error.middleware";
import { CouponModel } from "../../../../models/coupon.model";
import type { ServiceResponse } from "../../../../typings";
import { generateSlug } from "../../../../utils/text.utils";

class CouponAdminService {
  private readonly couponModel = CouponModel;

  //Create coupon
  createCoupon = async (
    code: string,
    discountValue: number,
    minPurchaseAmount: number,
    startDate: Date,
    expiresAt: Date,
    discountType: "percentage" = "percentage"
  ): Promise<ServiceResponse> => {
    try {
      const startDateObj = new Date(startDate);
      const expiresAtObj = new Date(expiresAt);

      if (!code || typeof code !== "string") {
        throw new AppError("Coupon code is required", HTTP.BAD_REQUEST);
      }

      if (
        !discountValue ||
        typeof discountValue !== "number" ||
        discountValue <= 0
      ) {
        throw new AppError(
          "Valid discount value is required",
          HTTP.BAD_REQUEST
        );
      }

      if (
        minPurchaseAmount !== undefined &&
        (typeof minPurchaseAmount !== "number" || minPurchaseAmount < 0)
      ) {
        throw new AppError(
          "Valid minimum purchase amount is required",
          HTTP.BAD_REQUEST
        );
      }

      if (!startDateObj || Number.isNaN(startDateObj.getTime())) {
        throw new AppError("Start date must be a valid date", HTTP.BAD_REQUEST);
      }

      if (!expiresAtObj || Number.isNaN(expiresAtObj.getTime())) {
        throw new AppError(
          "Expiry date must be a valid date",
          HTTP.BAD_REQUEST
        );
      }

      if (startDateObj >= expiresAtObj) {
        throw new AppError(
          "Start date must be before expiry date",
          HTTP.BAD_REQUEST
        );
      }

      const existing = await this.couponModel.findOne({
        code: { $regex: `^${code}$`, $options: "i" },
        isDeleted: false,
      });
      if (existing) {
        throw new AppError("Coupon code already exists", HTTP.CONFLICT);
      }

      const coupon = await this.couponModel.create({
        code,
        slug: generateSlug(code),
        discountValue,
        discountType,
        minPurchaseAmount,
        startDate,
        expiresAt,
        isActive: true,
        isDeleted: false,
      });

      return {
        data: coupon,
        message: "Coupon created successfully",
        status: HTTP.CREATED,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  };

  //Update coupon
  async updateCoupon(
    id: string,
    code: string,
    discountValue: number,
    minPurchaseAmount: number,
    startDate: Date,
    expiresAt: Date,
    discountType: "percentage" | "flat" = "percentage",
    isActive?: boolean
  ): Promise<ServiceResponse> {
    try {
      // Validation
      if (!id) {
        throw new AppError("Coupon ID is required", HTTP.BAD_REQUEST);
      }

      if (!code || typeof code !== "string") {
        throw new AppError("Coupon code is required", HTTP.BAD_REQUEST);
      }

      if (
        !discountValue ||
        typeof discountValue !== "number" ||
        discountValue <= 0
      ) {
        throw new AppError(
          "Valid discount value is required",
          HTTP.BAD_REQUEST
        );
      }

      if (
        minPurchaseAmount !== undefined &&
        (typeof minPurchaseAmount !== "number" || minPurchaseAmount < 0)
      ) {
        throw new AppError(
          "Valid minimum purchase amount is required",
          HTTP.BAD_REQUEST
        );
      }

      if (!startDate || Number.isNaN(startDate.getTime())) {
        throw new AppError("Start date must be a valid date", HTTP.BAD_REQUEST);
      }

      if (!expiresAt || Number.isNaN(expiresAt.getTime())) {
        throw new AppError(
          "Expiry date must be a valid date",
          HTTP.BAD_REQUEST
        );
      }

      if (startDate >= expiresAt) {
        throw new AppError(
          "Start date must be before expiry date",
          HTTP.BAD_REQUEST
        );
      }

      // Check for duplicate coupon code (ignore same id)
      const existing = await this.couponModel.findOne({
        code: { $regex: `^${code}$`, $options: "i" },
        _id: { $ne: id }, // exclude current coupon
        isDeleted: false,
      });
      if (existing) {
        throw new AppError("Coupon code already exists", HTTP.CONFLICT);
      }

      // Update coupon
      const updatedCoupon = await this.couponModel.findByIdAndUpdate(
        id,
        {
          code,
          slug: generateSlug(code),
          discountValue,
          discountType,
          minPurchaseAmount,
          startDate,
          expiresAt,
          ...(isActive !== undefined && { isActive }),
        },
        { new: true }
      );

      if (!updatedCoupon) {
        throw new AppError("Coupon not found", HTTP.NOT_FOUND);
      }

      return {
        data: updatedCoupon,
        message: "Coupon updated successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  //Get coupon by id
  getById = async (id: string): Promise<ServiceResponse> => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id))
        throw new AppError("Invalid coupon ID", HTTP.BAD_REQUEST);

      const coupon = await this.couponModel.findOne({
        _id: id,
        isDeleted: false,
      });

      return {
        data: coupon,
        message: "Coupon fetched successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  };

  //List coupons with isActive/isDeleted filter
  getAll = async (
    page: number = 1,
    limit: number = 10,
    isActive?: boolean
  ): Promise<ServiceResponse> => {
    try {
      // Base query excludes deleted coupons
      const query: Record<string, any> = { isDeleted: false };

      if (typeof isActive === "boolean") {
        query.isActive = isActive;
      }

      const skip = (page - 1) * limit;

      const [coupons, total] = await Promise.all([
        this.couponModel
          .find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        this.couponModel.countDocuments(query),
      ]);

      return {
        data: {
          coupons,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit) || 1,
            totalItems: total,
            itemsPerPage: limit,
            hasNext: page * limit < total,
            hasPrev: page > 1,
          },
        },
        message: "Coupons fetched successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  };

  //Toggle active/inactive
  toggleStatusById = async (
    couponId: string,
    isActive?: boolean
  ): Promise<ServiceResponse> => {
    try {
      const updateData: Partial<{ isActive: boolean }> = {};
      if (typeof isActive === "boolean") updateData.isActive = isActive;

      if (Object.keys(updateData).length === 0) {
        throw new AppError("No valid status update provided", HTTP.BAD_REQUEST);
      }

      const coupon = await this.couponModel.findByIdAndUpdate(
        couponId,
        updateData,
        { new: true }
      );

      if (!coupon || coupon.isDeleted)
        throw new AppError("Coupon not found", HTTP.NOT_FOUND);

      return {
        data: coupon,
        message: "Coupon status updated successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  };

  // ✅ Soft delete
  deleteById = async (id: string): Promise<ServiceResponse> => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id))
        throw new AppError("Invalid coupon ID", HTTP.BAD_REQUEST);

      const coupon = await this.couponModel.findByIdAndUpdate(
        id,
        { isDeleted: true },
        { new: true }
      );

      if (!coupon) throw new AppError("Coupon not found", HTTP.NOT_FOUND);

      return {
        data: coupon,
        message: "Coupon deleted successfully",
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

export default CouponAdminService;
