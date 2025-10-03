import express from "express";
import { UserAddressController } from "../../controllers/user/address.user.controller";

const userAddressRoutes: express.Router = express.Router();

const userAddressController = new UserAddressController();

userAddressRoutes.post("/", userAddressController.createAddress);
userAddressRoutes.patch("/:addressId", userAddressController.editAddress);
userAddressRoutes.delete("/:addressId", userAddressController.deleteAddress);
userAddressRoutes.get("/", userAddressController.getAddresses);

userAddressRoutes.get(
  "/calculate-fee/:addressId",
  userAddressController.calculateDeliveryFee
);

export default userAddressRoutes;
