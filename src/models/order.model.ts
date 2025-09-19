// import mongoose, { type Types } from "mongoose";
// import { type Address, addressSchema } from "./address.model";
// import { boxSchema } from "./box.model";
// import { PRODUCT_DB_REF } from "./product.model";
// import { USER_DB_REF } from "./user.model";
// export interface Items {
//   productId: Types.ObjectId;
//   productName: string;
//   variant: {
//     _id: string;
//     size: string;
//     price: number;
//     weight: {
//       square: string;
//       circle: string;
//     };
//   };
//   slug: string;
//   images: {
//     url: string;
//     mimeType: string;
//     publicKey: string;
//   }[];
//   shape: string;
//   quantity: number;
//   totalPrice: number;
// }
// export interface Orders {
//   orderId: string;

//   userId: mongoose.Schema.Types.ObjectId;
//   items: Items[];
//   totalAmount: number;
//   status: "pending" | "confirmed" | "failed";
//   paymentId: string;
//   paymentStatus: "pending" | "success" | "failed";
//   paymentMethod: "razorpay";
//   address: Address;
//   createdAt: Date;
//   updatedAt: Date;
//   coupon: {
//     code: string;
//     discountType: "percentage";
//     discountValue: number;
//     minPurchaseAmount: number;
//   };

//   gst: {
//     igst: number;
//     cgst: number;
//     sgst: number;
//   };
//   box: any;
//   orderGroupId: string;

//   shipment: {
//     shippingCharge: number;
//     shipmentId: string;
//     shiprocketOrderId: string;
//     awbCode: string;
//     trackingUrl: string;
//     courierCompanyId: number;
//     courierName: string;
//     pickupLocation: string; // Kochi Warehouse
//     pickupScheduledDate: Date; // 2025-07-27
//     shipmentCreatedAt: Date; // 2025-07-26
//     estimatedDeliveryDate: Date; // 2025-07-30
//     deliveredDate: Date; // 2025-07-29 (optional)
//     status: string; // Pickup Scheduled / In Transit / Delivered

//     // add these
//     manifestUrl?: string;
//     invoiceUrl?: string;
//     labelUrl?: string;
//     trackingData?: any;
//   };
// }
// const couponSchema = new mongoose.Schema({
//   code: {
//     type: String,
//     required: true,
//     uppercase: true,
//     trim: true,
//   },
//   discountType: {
//     type: String,
//     enum: ["percentage"],
//     required: true,
//     default: "percentage",
//   },
//   discountValue: {
//     type: Number,
//     required: true,
//     min: 1,
//     max: 100,
//   },

//   minPurchaseAmount: {
//     type: Number,
//     default: 0,
//   },
// });
// const orderSchema = new mongoose.Schema<Orders>(
//   {
//     orderId: { type: String, required: true },
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: USER_DB_REF,
//       required: true,
//     },
//     items: [
//       {
//         productId: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: PRODUCT_DB_REF,
//           required: true,
//         },
//         productName: { type: String, required: true },
//         variant: {
//           size: { type: String, required: true },
//           price: { type: Number, required: true },
//           weight: {
//             square: { type: String, required: false },
//             circle: { type: String, required: false },
//             value: { type: String, required: false },
//           },
//         },
//         slug: { type: String, required: true },
//         images: [
//           {
//             url: { type: String, required: true },
//             mimeType: { type: String, required: true },
//             publicKey: { type: String, required: true },
//           },
//         ],
//         shape: {
//           type: String,
//           enum: ["square", "circle", "value"],
//           required: true,
//         },
//         quantity: { type: Number, required: true },
//         totalPrice: { type: Number, required: true },
//       },
//     ],
//     totalAmount: { type: Number, required: true },
//     status: {
//       type: String,
//       enum: [
//         "pending",
//         "confirmed",
//         "failed",
//         "pickup_scheduled",
//         "in_transit",
//         "delivered",
//       ],
//       default: "pending",
//     },
//     paymentId: { type: String, required: false },
//     paymentStatus: {
//       type: String,
//       enum: ["pending", "success", "failed"],
//       default: "pending",
//     },
//     coupon: {
//       type: couponSchema,
//       required: false,
//     },
//     paymentMethod: { type: String, enum: ["razorpay"], default: "razorpay" },
//     address: {
//       type: addressSchema,
//       required: true,
//     },

//     gst: {
//       igst: {
//         type: Number,
//       },
//       cgst: {
//         type: Number,
//       },
//       sgst: {
//         type: Number,
//       },
//     },

//     box: {
//       type: boxSchema,
//       required: false,
//     },
//     shipment: {
//       shippingCharge: { type: Number, required: false },
//       shipmentId: { type: String, required: false },
//       shiprocketOrderId: { type: String, required: false },
//       awbCode: { type: String, required: false },
//       trackingUrl: { type: String, required: false },
//       courierCompanyId: { type: Number, required: false },
//       courierName: { type: String, required: false },
//       pickupLocation: { type: String, required: false },
//       pickupScheduledDate: { type: Date, required: false },
//       shipmentCreatedAt: { type: Date, required: false },
//       pickupRequest: { type: Boolean, required: false },
//       estimatedDeliveryDate: { type: Date, required: false },
//       deliveredDate: { type: Date, required: false },
//       manifestUrl: { type: String, required: false },
//       invoiceUrl: { type: String, required: false },
//       labelUrl: { type: String, required: false },
//       trackingData: { type: Object, required: false },
//     },
//   },
//   {
//     timestamps: true,
//   }
// );
// export const ORDER_DB_REF = "orders";
// export const OrderModel = mongoose.model(ORDER_DB_REF, orderSchema);
