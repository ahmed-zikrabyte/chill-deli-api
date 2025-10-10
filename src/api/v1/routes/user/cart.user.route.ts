import express from "express";
import { CartUserController } from "../../controllers/user/cart.user.controller";

const cartUserRoutes: express.Router = express.Router();
const cartUserController = new CartUserController();

// ===>  v1/user/cart/
cartUserRoutes.post("/add", cartUserController.addProductToCart);
cartUserRoutes.delete("/remove", cartUserController.removeProductFromCart);
cartUserRoutes.patch("/update", cartUserController.updateCartItemQuantity);
cartUserRoutes.get("/", cartUserController.getCart);
cartUserRoutes.get("/count", cartUserController.getCartCount);

export default cartUserRoutes;
