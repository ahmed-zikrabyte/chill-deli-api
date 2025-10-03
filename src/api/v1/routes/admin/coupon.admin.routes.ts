import express from "express";
import { CouponAdminController } from "../../controllers/admin/coupon.admin.controller";

const couponRoutes: express.Router = express.Router();

const couponAdminController = new CouponAdminController();

// ===>  v1/admin/coupon/
couponRoutes.post("/", couponAdminController.create);
couponRoutes.patch("/:id", couponAdminController.update);
couponRoutes.patch("/status/:id", couponAdminController.toggleCouponStatus);
couponRoutes.get("/", couponAdminController.getAll);
couponRoutes.get("/id/:id", couponAdminController.getById);
couponRoutes.delete("/:id", couponAdminController.deleteById);

export default couponRoutes;
