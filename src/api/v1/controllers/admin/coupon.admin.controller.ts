import type { Request, Response } from "express";
import { catchAsync } from "../../../../utils/catch-async.util";
import { ApiResponse } from "../../../../utils/response.util";
import CouponAdminService from "../../services/admin/coupon.service";

const couponAdminService = new CouponAdminService();

export class CouponAdminController {
  // === LIST COUPONS ===
  getAll = catchAsync(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, status } = req.query;

    // Map status to isActive
    let isActive: boolean | undefined;
    if (status === "active") isActive = true;
    else if (status === "inactive") isActive = false;

    const response = await couponAdminService.getAll(
      Number(page),
      Number(limit),
      isActive
    );

    return ApiResponse.success({
      res,
      data: response.data,
      message: response.message,
      statusCode: response.status,
    });
  });

  // === CREATE COUPON ===
  create = catchAsync(async (req: Request, res: Response) => {
    const {
      code,
      discountValue,
      minPurchaseAmount,
      startDate,
      expiresAt,
      discountType,
    } = req.body;

    const response = await couponAdminService.createCoupon(
      code,
      Number(discountValue),
      Number(minPurchaseAmount),
      new Date(startDate),
      new Date(expiresAt),
      discountType || "percentage"
    );

    return ApiResponse.success({
      res,
      data: response.data,
      message: response.message,
      statusCode: response.status,
    });
  });

  // === UPDATE COUPON ===
  update = catchAsync(async (req: Request, res: Response) => {
    const {
      code,
      discountValue,
      minPurchaseAmount,
      startDate,
      expiresAt,
      discountType,
      isActive,
    } = req.body;

    const response = await couponAdminService.updateCoupon(
      req.params.id,
      code,
      Number(discountValue),
      Number(minPurchaseAmount),
      new Date(startDate),
      new Date(expiresAt),
      discountType || "percentage",
      isActive
    );

    return ApiResponse.success({
      res,
      data: response.data,
      message: response.message,
      statusCode: response.status,
    });
  });

  // === GET COUPON BY ID ===
  getById = catchAsync(async (req: Request, res: Response) => {
    const response = await couponAdminService.getById(req.params.id);
    return ApiResponse.success({
      res,
      data: response.data,
      message: response.message,
      statusCode: response.status,
    });
  });

  // === TOGGLE COUPON STATUS ===
  toggleCouponStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isActive } = req.body;

    const response = await couponAdminService.toggleStatusById(
      id,
      typeof isActive === "boolean" ? isActive : isActive === "true"
    );

    return ApiResponse.success({
      res,
      data: response.data,
      message: response.message,
      statusCode: response.status,
    });
  });

  // === SOFT DELETE COUPON ===
  deleteById = catchAsync(async (req: Request, res: Response) => {
    const response = await couponAdminService.deleteById(req.params.id);
    return ApiResponse.success({
      res,
      data: response.data,
      message: response.message,
      statusCode: response.status,
    });
  });
}
