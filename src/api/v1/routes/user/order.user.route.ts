import express from "express";
import { OrderUserController } from "../../controllers/user/order.user.controller";

const orderUserRoutes: express.Router = express.Router();

const orderUserController = new OrderUserController();

orderUserRoutes.post("/", orderUserController.createOrder);

orderUserRoutes.get("/", orderUserController.getUserOrders);

orderUserRoutes.post("/verify-payment", orderUserController.verifyPayment);

orderUserRoutes.get("/:orderId", orderUserController.getUserOrderById);

orderUserRoutes.post("/invoice-download", orderUserController.downloadInvoice);

export default orderUserRoutes;
