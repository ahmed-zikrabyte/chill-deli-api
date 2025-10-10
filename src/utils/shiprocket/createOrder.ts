import axios from "axios";
import { getValidShiprocketToken } from "./generateToken";

interface ShiprocketOrderItem {
  name: string;
  sku: string;
  units: number;
  selling_price: number;
}

interface ShiprocketOrderData {
  order_id: string;
  order_date: string;
  pickup_location: string;
  billing_customer_name: string;
  billing_last_name?: string;
  billing_address: string;
  billing_city: string;
  billing_pincode: number;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: number;
  shipping_is_billing: boolean;
  latitude: number;
  longitude: number;
  order_items: ShiprocketOrderItem[];
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
}

export async function createShiprocketOrder(orderData: ShiprocketOrderData) {
  try {
    const token = await getValidShiprocketToken();

    const payload = {
      order_id: orderData.order_id,
      order_date: orderData.order_date,
      pickup_location: orderData.pickup_location,
      billing_customer_name: orderData.billing_customer_name,
      billing_last_name: orderData.billing_last_name || "",
      billing_address: orderData.billing_address,
      billing_city: orderData.billing_city,
      billing_pincode: orderData.billing_pincode,
      billing_state: orderData.billing_state,
      billing_country: orderData.billing_country,
      billing_email: orderData.billing_email,
      billing_phone: orderData.billing_phone,
      shipping_is_billing: orderData.shipping_is_billing,
      order_items: orderData.order_items,
      payment_method: "Prepaid",
      sub_total: orderData.sub_total,
      length: orderData.length,
      breadth: orderData.breadth,
      height: orderData.height,
      weight: orderData.weight,
      latitude: orderData.latitude,
      longitude: orderData.longitude,
      shipping_method: "HL",
      checkout_shipping_method: "SR_QUICK",
    };

    console.log(
      "📦 Sending Shiprocket payload:",
      JSON.stringify(payload, null, 2)
    );

    const response = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("✅ Shiprocket response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Shiprocket API Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      requestData: error.config?.data,
    });
    throw error;
  }
}
