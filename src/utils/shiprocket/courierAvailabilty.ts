import axios from "axios";
import { ENV } from "../../config/env";
import { getValidShiprocketToken } from "./generateToken";

export const checkHyperlocalCourierAvailability = async (
  delivery_pincode: string,
  delivery_lat: number,
  delivery_long: number,
  weight: number
) => {
  try {
    const token = await getValidShiprocketToken();
    const response = await axios.get(
      "https://apiv2.shiprocket.in/v1/external/courier/serviceability",
      {
        params: {
          pickup_postcode: ENV.shiprocket.pickupPincode,
          delivery_postcode: delivery_pincode,
          weight,
          cod: 0,
          is_new_hyperlocal: 1,
          lat_from: ENV.shiprocket.pickupLat,
          long_from: ENV.shiprocket.pickupLong,
          lat_to: delivery_lat,
          long_to: delivery_long,
        },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
