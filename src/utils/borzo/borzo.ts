// borzoClient.ts
import axios from "axios";
import { getBorzoToken } from "./generateToken";

const BASE_URL = "https://robotapitest-in.borzodelivery.com/api/business/1.6";

// Axios instance with Borzo token
const borzoAxios = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Token ${getBorzoToken()}`,
    "Content-Type": "application/json",
  },
});

// 1️⃣ Calculate Order
export const calculateOrder = async (data: any) => {
  try {
    const res = await borzoAxios.post("/calculate-order", data);
    return res.data;
  } catch (error) {
    console.error("Calculate order failed", error);
    throw error;
  }
};

// 2️⃣ Create Order
export const createOrder = async (data: any) => {
  try {
    const res = await borzoAxios.post("/create-order", data);
    return res.data;
  } catch (error) {
    console.error("Create order failed", error);
    throw error;
  }
};

// 3️⃣ Cancel Order
export const cancelOrder = async (orderId: string) => {
  try {
    const res = await borzoAxios.post("/cancel-order", { order_id: orderId });
    return res.data;
  } catch (error) {
    console.error("Cancel order failed", error);
    throw error;
  }
};

// 4️⃣ Get Orders
export const getOrders = async (params?: any) => {
  try {
    const res = await borzoAxios.get("/orders", { params });
    return res.data;
  } catch (error) {
    console.error("Get orders failed", error);
    throw error;
  }
};

// 5️⃣ Get Courier Info
export const getCourierInfo = async (courierId: number) => {
  try {
    const res = await borzoAxios.get(`/courier/${courierId}`);
    return res.data;
  } catch (error) {
    console.error("Get courier info failed", error);
    throw error;
  }
};

// 6️⃣ Get Courier Location
export const getCourierLocation = async (courierId: number) => {
  try {
    const res = await borzoAxios.get(`/courier/${courierId}/location`);
    return res.data;
  } catch (error) {
    console.error("Get courier location failed", error);
    throw error;
  }
};

export default {
  calculateOrder,
  createOrder,
  cancelOrder,
  getOrders,
  getCourierInfo,
  getCourierLocation,
};
