import { Types } from "mongoose";
import { HTTP } from "../../../../config/http-status.config";
import { AppError } from "../../../../middleware/error.middleware";
import { type Address, AddressModel } from "../../../../models/address.model";
import { Cart } from "../../../../models/cart.model";
import type { ServiceResponse } from "../../../../typings";
import { calculateOrder, createOrder } from "../../../../utils/borzo/borzo";

const BORZO_PICKUP = {
  lat: 12.9716, // store latitude
  lng: 77.5946, // store longitude
};

class UserAddressService {
  private readonly addressModel = AddressModel;
  private readonly cartModel = Cart;

  // Create a new address
  createAddress = async (userId: string, address: Address): ServiceResponse => {
    try {
      if (
        !userId ||
        !address.name ||
        !address.phone ||
        !address.house ||
        !address.area ||
        !address.city ||
        !address.state ||
        !address.pincode
      )
        throw new AppError("Invalid input", HTTP.BAD_REQUEST);

      // Check if user already has an address with the same type
      const existingAddress = await this.addressModel.findOne({
        userId,
        addressType: address.addressType,
      });

      if (existingAddress) {
        throw new AppError(
          `Address of type '${address.addressType}' already exists`,
          HTTP.BAD_REQUEST
        );
      }

      const newAddress = await this.addressModel.create({
        userId,
        name: address.name,
        phone: address.phone,
        house: address.house,
        area: address.area,
        landmark: address.landmark,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        latitude: address.latitude,
        longitude: address.longitude,
        addressType: address.addressType,
        isDefault: address.isDefault,
      });

      return {
        data: newAddress,
        message: "Address created successfully",
        status: HTTP.CREATED,
        success: true,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  };

  // Edit address
  editAddress = async (
    userId: string,
    addressId: string,
    address: Address
  ): ServiceResponse => {
    try {
      const existingAddress = await this.addressModel.findOne({
        _id: new Types.ObjectId(addressId),
        userId: new Types.ObjectId(userId),
      });
      if (!existingAddress)
        throw new AppError("Address not found", HTTP.NOT_FOUND);

      await this.addressModel.updateOne(
        {
          _id: new Types.ObjectId(addressId),
          userId: new Types.ObjectId(userId),
        },
        { $set: address }
      );

      return {
        data: await this.addressModel.findById(addressId),
        message: "Address updated successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  };

  // Delete address
  deleteAddress = async (
    userId: string,
    addressId: string
  ): ServiceResponse => {
    try {
      const deletedAddress = await this.addressModel.findOneAndDelete({
        _id: new Types.ObjectId(addressId),
        userId: new Types.ObjectId(userId),
      });
      if (!deletedAddress)
        throw new AppError("Address not found", HTTP.NOT_FOUND);

      return {
        data: deletedAddress,
        message: "Address deleted successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  };

  // Get all addresses of a user
  getAddresses = async (userId: string): ServiceResponse => {
    if (!userId) throw new AppError("Invalid input", HTTP.BAD_REQUEST);
    try {
      const addresses = await this.addressModel.find({
        userId: new Types.ObjectId(userId),
      });
      return {
        data: addresses,
        message: "Addresses fetched successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  };

  // Check courier availability & calculate delivery fee using Borzo
  checkCourierAvailability = async (addressId: string): ServiceResponse => {
    if (!addressId) throw new AppError("Invalid input", HTTP.BAD_REQUEST);

    const address = await this.addressModel.findById(addressId);
    if (!address) throw new AppError("Address not found", HTTP.NOT_FOUND);
    if (!address.latitude || !address.longitude)
      throw new AppError(
        "Address latitude and longitude required",
        HTTP.BAD_REQUEST
      );

    const cart = await this.cartModel
      .findOne({ userId: address.userId })
      .populate("items.productId");
    if (!cart || !cart.items.length)
      throw new AppError("Cart is empty", HTTP.BAD_REQUEST);

    // Prepare parcels for Borzo
    const parcels = cart.items.map((item: any) => {
      const product = item.productId;
      const variant = product.variants.find(
        (v: any) => v._id.toString() === item.variant.toString()
      );
      if (!variant)
        throw new AppError(
          `Variant not found for product ${product._id}`,
          HTTP.BAD_REQUEST
        );
      return {
        name: product.name,
        quantity: item.quantity,
        weight: Number(variant.weight[item.shape]) / 1000,
      };
    });

    // Call Borzo calculate-order
    try {
      const res = await calculateOrder({
        pickup_point: BORZO_PICKUP,
        drop_point: { lat: address.latitude, lng: address.longitude },
        parcels,
        cod_amount: 0,
      });

      return {
        data: {
          delivery_fee: res.delivery_fee_amount,
          borzo_response: res,
        },
        message: "Courier availability & delivery fee fetched successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error: any) {
      throw new AppError(
        error.response?.data?.message || error.message,
        HTTP.INTERNAL_SERVER_ERROR
      );
    }
  };

  // Create Borzo Order
  createBorzoOrder = async (addressId: string): ServiceResponse => {
    const address = await this.addressModel.findById(addressId);
    if (!address) throw new AppError("Address not found", HTTP.NOT_FOUND);

    const cart = await this.cartModel
      .findOne({ userId: address.userId })
      .populate("items.productId");
    if (!cart || !cart.items.length)
      throw new AppError("Cart is empty", HTTP.BAD_REQUEST);

    const parcels = cart.items.map((item: any) => {
      const product = item.productId;
      const variant = product.variants.find(
        (v: any) => v._id.toString() === item.variant.toString()
      );
      if (!variant)
        throw new AppError(
          `Variant not found for product ${product._id}`,
          HTTP.BAD_REQUEST
        );
      return {
        name: product.name,
        quantity: item.quantity,
        weight: Number(variant.weight[item.shape]) / 1000,
      };
    });

    try {
      const res = await createOrder({
        pickup_point: BORZO_PICKUP,
        drop_point: { lat: address.latitude, lng: address.longitude },
        parcels,
        cod_amount: 0,
        customer_name: address.name,
        customer_phone: address.phone,
        customer_address: `${address.house}, ${address.area}, ${address.city}, ${address.state}, ${address.pincode}`,
      });

      return {
        data: res,
        message: "Borzo order created successfully",
        status: HTTP.CREATED,
        success: true,
      };
    } catch (error: any) {
      throw new AppError(
        error.response?.data?.message || error.message,
        HTTP.INTERNAL_SERVER_ERROR
      );
    }
  };
}

export default UserAddressService;
