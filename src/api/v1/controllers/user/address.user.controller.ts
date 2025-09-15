// import type { Request, Response } from "express";
// import type { Address } from "../../../../models/address.model";
// import { catchAsync } from "../../../../utils/catch-async.util";
// import { ApiResponse } from "../../../../utils/response.util";
// import UserAddressService from "../../services/user/address.user.service";

// const userAddressService = new UserAddressService();

// export class UserAddressController {
//   createAddress = catchAsync(async (req: Request, res: Response) => {
//     const { _id } = req.user;
//     const response = await userAddressService.createAddress(
//       _id,
//       req.body as Address
//     );
//     return ApiResponse.success({
//       res,
//       message: response.message,
//       data: response.data,
//       statusCode: response.status,
//     });
//   });
//   editAddress = catchAsync(async (req: Request, res: Response) => {
//     const { _id } = req.user;
//     const { addressId } = req.params;

//     const response = await userAddressService.editAddress(
//       _id,
//       addressId,
//       req.body as Address
//     );
//     return ApiResponse.success({
//       res,
//       message: response.message,
//       data: response.data,
//       statusCode: response.status,
//     });
//   });

//   deleteAddress = catchAsync(async (req: Request, res: Response) => {
//     const { _id } = req.user;
//     const { addressId } = req.params;
//     const response = await userAddressService.deleteAddress(_id, addressId);
//     return ApiResponse.success({
//       res,
//       message: response.message,
//       data: response.data,
//       statusCode: response.status,
//     });
//   });

//   getAddresses = catchAsync(async (req: Request, res: Response) => {
//     const { _id } = req.user;
//     const response = await userAddressService.getAddresses(_id);
//     return ApiResponse.success({
//       res,
//       message: response.message,
//       data: response.data,
//       statusCode: response.status,
//     });
//   });

//   checkCourierAvailability = catchAsync(async (req: Request, res: Response) => {
//     const { _id } = req.user;
//     console.log({ _id });
//     const { addressId } = req.params;
//     const response =
//       await userAddressService.checkCourierAvailability(addressId);
//     return ApiResponse.success({
//       res,
//       message: response.message,
//       data: response.data,
//       statusCode: response.status,
//     });
//   });
// }
