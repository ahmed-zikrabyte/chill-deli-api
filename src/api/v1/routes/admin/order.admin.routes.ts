import express from "express";
import OrderAdminController from "../../controllers/admin/order.admin.controller";

const orderController = new OrderAdminController();
const orderAdminRouter = express.Router();

orderAdminRouter.get("/", orderController.getAllOrders);

orderAdminRouter.get("/export", orderController.exportOrderToExcel);

orderAdminRouter.get("/:id", orderController.getOrderById);

export default orderAdminRouter;
