import { Types } from "mongoose";
import { HTTP } from "../../../../config/http-status.config";
import { AppError } from "../../../../middleware/error.middleware";
import { type Address, AddressModel } from "../../../../models/address.model";
import { Cart } from "../../../../models/cart.model";
import type { ServiceResponse } from "../../../../typings";
import { checkHyperlocalCourierAvailability } from "../../../../utils/shiprocket/courierAvailabilty";

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

  // Check delivery rates
  checkDeliveryRates = async (
    delivery_pincode: string,
    delivery_lat: number,
    delivery_long: number,
    weight: number = 1
  ): ServiceResponse => {
    try {
      const courierData = await checkHyperlocalCourierAvailability(
        delivery_pincode,
        delivery_lat,
        delivery_long,
        weight
      );

      if (courierData.status && courierData.data.length > 0) {
        const courier = courierData.data[0];
        return {
          data: {
            courier_name: courier.courier_name,
            rate: courier.rates,
            etd: courier.etd,
            etd_hours: courier.etd_hours,
            distance: courier.distance,
          },
          message: "Delivery rates fetched successfully",
          status: HTTP.OK,
          success: true,
        };
      } else {
        throw new AppError(
          "No courier available for this location",
          HTTP.NOT_FOUND
        );
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  };
}

export default UserAddressService;
