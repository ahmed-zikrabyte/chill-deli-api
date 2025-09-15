// import { Types } from "mongoose";
// import { HTTP } from "../../../../config/http-status.config";
// import { AppError } from "../../../../middleware/error.middleware";
// import { type Address, AddressModel } from "../../../../models/address.model";
// import boxModel from "../../../../models/box.model";
// import { Cart } from "../../../../models/cart.model";
// import type { ServiceResponse } from "../../../../typings";
// import { checkCourierAvailability } from "../../../../utils/shiprocket/courier-availablity";

// class UserAddressService {
//   private readonly addressModel = AddressModel;
//   private readonly boxModel = boxModel;
//   private readonly cartModel = Cart;

//   createAddress = async (userId: string, address: Address): ServiceResponse => {
//     console.log({ address });
//     try {
//       const {
//         fullName,
//         phone,
//         pincode,
//         state,
//         district,
//         house,
//         area,
//         landmark,
//         addressType,
//       } = address;

//       console.log({
//         fullName,
//         phone,
//         pincode,
//         state,
//         district,
//         house,
//         area,
//         landmark,
//         addressType,
//       });

//       if (
//         !userId ||
//         !fullName ||
//         !phone ||
//         !pincode ||
//         !state ||
//         !district ||
//         !house ||
//         !area ||
//         !addressType ||
//         !landmark
//       ) {
//         throw new AppError("Invalid input", HTTP.BAD_REQUEST);
//       }

//       const newAddress = await this.addressModel.create({
//         userId,
//         fullName,
//         phone,
//         pincode,
//         state,
//         district,
//         house,
//         area,
//         landmark,
//         addressType,
//       });

//       return {
//         data: newAddress,
//         message: "Address created successfully",
//         status: HTTP.CREATED,
//         success: true,
//       };
//     } catch (error) {
//       if (error instanceof AppError) throw error;
//       throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
//     }
//   };

//   editAddress = async (
//     userId: string,
//     addressId: string,
//     address: Address
//   ): ServiceResponse => {
//     try {
//       const existingAddress = await this.addressModel.findOne({
//         _id: new Types.ObjectId(addressId),
//         userId: new Types.ObjectId(userId),
//       });
//       if (!existingAddress) {
//         throw new AppError("Address not found", HTTP.NOT_FOUND);
//       }

//       const updatedAddress = await this.addressModel.updateOne(
//         {
//           _id: new Types.ObjectId(addressId),
//           userId: new Types.ObjectId(userId),
//         },
//         {
//           $set: {
//             fullName: address.fullName,
//             phone: address.phone,
//             pincode: address.pincode,
//             state: address.state,
//             district: address.district,
//             house: address.house,
//             area: address.area,
//             landmark: address.landmark,
//             addressType: address.addressType,
//           },
//         }
//       );

//       return {
//         data: updatedAddress,
//         message: "Address updated successfully",
//         status: HTTP.OK,
//         success: true,
//       };
//     } catch (error) {
//       if (error instanceof AppError) throw error;
//       throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
//     }
//   };

//   deleteAddress = async (
//     userId: string,
//     addressId: string
//   ): ServiceResponse => {
//     try {
//       const existingAddress = await this.addressModel.findOne({
//         _id: new Types.ObjectId(addressId),
//         userId: new Types.ObjectId(userId),
//       });
//       if (!existingAddress) {
//         throw new AppError("Address not found", HTTP.NOT_FOUND);
//       }

//       const deletedAddress = await this.addressModel.deleteOne({
//         _id: new Types.ObjectId(addressId),
//         userId: new Types.ObjectId(userId),
//       });

//       return {
//         data: deletedAddress,
//         message: "Address deleted successfully",
//         status: HTTP.OK,
//         success: true,
//       };
//     } catch (error) {
//       if (error instanceof AppError) throw error;
//       throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
//     }
//   };

//   getAddresses = async (userId: string): ServiceResponse => {
//     if (!userId) {
//       throw new AppError("Invalid input", HTTP.BAD_REQUEST);
//     }
//     try {
//       const addresses = await this.addressModel.find({
//         userId: new Types.ObjectId(userId),
//       });

//       return {
//         data: addresses,
//         message: "Addresses fetched successfully",
//         status: HTTP.OK,
//         success: true,
//       };
//     } catch (error) {
//       if (error instanceof AppError) throw error;
//       throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
//     }
//   };

//   checkCourierAvailability = async (addressId: string): ServiceResponse => {
//     if (!addressId) {
//       throw new AppError("Invalid input", HTTP.BAD_REQUEST);
//     }

//     const address = await this.addressModel.findById(addressId);
//     if (!address) {
//       throw new AppError("Address not found", HTTP.NOT_FOUND);
//     }

//     // 1. Get the user's cart with products and variants populated
//     const cart = await this.cartModel
//       .findOne({ userId: address.userId })
//       .populate("items.productId"); // Ensure productId contains variants

//     if (!cart || !cart.items.length) {
//       throw new AppError("Cart is empty", HTTP.BAD_REQUEST);
//     }

//     // 2. Calculate total item count & weight (convert grams → kg)
//     let totalItemCount = 0;
//     let totalItemWeight = 0;

//     cart.items.forEach((item: any) => {
//       totalItemCount += item.quantity;

//       const product = item.productId;
//       const variantId = item.variant; // selected variant ID from cart
//       const shape = item.shape;

//       const variant = product.variants.find(
//         (v: { _id: Types.ObjectId }) =>
//           v._id.toString() === variantId.toString()
//       );

//       if (!variant) {
//         throw new AppError(
//           `Variant not found for product ${product._id}`,
//           HTTP.BAD_REQUEST
//         );
//       }

//       // variant.weight is in grams → convert to kg
//       const variantWeight = Number(variant.weight[shape]);
//       totalItemWeight += variantWeight * item.quantity;
//     });

//     // 3. Find matching box
//     const box = await this.boxModel.findOne({
//       "itemCountRange.min": { $lte: totalItemCount },
//       "itemCountRange.max": { $gte: totalItemCount },
//     });

//     if (!box) {
//       throw new AppError(
//         "No suitable box found for the given item count",
//         HTTP.BAD_REQUEST
//       );
//     }

//     // 4. Calculate shipment weight (kg)
//     const shipmentWeightKg = (totalItemWeight + box.boxWeight) / 1000;

//     // 5. Call Shiprocket API
//     try {
//       const response = await checkCourierAvailability(
//         "591109", // pickup pincode
//         address.pincode as string, // delivery pincode
//         shipmentWeightKg // pass total weight in kg
//       );

//       const availableCouriers =
//         response?.data?.available_courier_companies || [];

//       if (!availableCouriers.length) {
//         throw new Error("No courier services available for this shipment.");
//       }

//       // Find the courier with the lowest rate
//       const cheapestCourier = availableCouriers.reduce(
//         (min: any, courier: any) => (courier.rate < min.rate ? courier : min)
//       );

//       return {
//         data: cheapestCourier,
//         message: "Courier availability checked successfully",
//         status: HTTP.OK,
//         success: true,
//       };
//     } catch (error) {
//       if (error instanceof AppError) throw error;
//       throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
//     }
//   };
// }

// export default UserAddressService;
