import * as crypto from "node:crypto";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZOR_PAY_KEY,
  key_secret: process.env.RAZOR_PAY_SECRET_KEY,
});

const createOrder = async (amount: number, orderId: string) => {
  try {
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: orderId,
    });
    return order;
  } catch (error) {
    console.error("Razorpay createOrder error:", error);
    throw new Error("Failed to create Razorpay order");
  }
};

const validateRazorpaySignature = (
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): boolean => {
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return expectedSignature === signature;
};

export { createOrder, validateRazorpaySignature };
