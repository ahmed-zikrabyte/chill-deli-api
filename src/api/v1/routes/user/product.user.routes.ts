import express from "express";
import UserProductController from "../../controllers/user/product.user.controller";

const userProductRouter = express.Router();
const userProductController = new UserProductController();

// ===> v1/admin/products/
userProductRouter.get("/", userProductController.getAll);

userProductRouter.get("/all", userProductController.getAllWithoutPagination);

userProductRouter.get(
  "/available-for-delivery",
  userProductController.getAvailableForDelivery
);

userProductRouter.get("/id/:id", userProductController.getById);

export default userProductRouter;
