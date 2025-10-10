import axios from "axios";
import { getValidShiprocketToken } from "./generateToken";

const assignAWB = async (shipmentId: number) => {
  console.log({ shipmentId });
  try {
    const token = await getValidShiprocketToken();
    const res = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/courier/assign/awb",
      {
        shipment_id: shipmentId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return res.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export default assignAWB;
