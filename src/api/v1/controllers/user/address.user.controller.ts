import type { Request, Response } from "express";
import type { Address } from "../../../../models/address.model";
import { catchAsync } from "../../../../utils/catch-async.util";
import { ApiResponse } from "../../../../utils/response.util";
import UserAddressService from "../../services/user/address.user.service";

const userAddressService = new UserAddressService();

export class UserAddressController {
  createAddress = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const response = await userAddressService.createAddress(
      userId,
      req.body as Address
    );
    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  editAddress = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { addressId } = req.params;

    const response = await userAddressService.editAddress(
      userId,
      addressId,
      req.body as Address
    );
    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  deleteAddress = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { addressId } = req.params;
    const response = await userAddressService.deleteAddress(userId, addressId);
    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  getAddresses = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const response = await userAddressService.getAddresses(userId);
    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  calculateDeliveryFee = catchAsync(async (req: Request, res: Response) => {
    const { addressId } = req.params;
    const response =
      await userAddressService.checkCourierAvailability(addressId);
    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  createBorzoOrder = catchAsync(async (req: Request, res: Response) => {
    const { addressId } = req.params;
    const response = await userAddressService.createBorzoOrder(addressId);
    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });
}
