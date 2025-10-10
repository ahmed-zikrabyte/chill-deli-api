import express from "express";
import { UserAddressController } from "../../controllers/user/address.user.controller";

const userAddressRoutes: express.Router = express.Router();

const userAddressController = new UserAddressController();

userAddressRoutes.post("/", userAddressController.createAddress);
userAddressRoutes.patch("/:addressId", userAddressController.editAddress);
userAddressRoutes.delete("/:addressId", userAddressController.deleteAddress);
userAddressRoutes.get("/", userAddressController.getAddresses);
userAddressRoutes.post(
  "/check-delivery-rates",
  userAddressController.checkDeliveryRates
);

export default userAddressRoutes;
