import express from "express";
import UserStoreController from "../../controllers/user/store.user.controller";

const userStoreRouter = express.Router();
const userStoreController = new UserStoreController();

// Get all stores
userStoreRouter.get("/", userStoreController.getAll);

// Get store by ID
userStoreRouter.get("/id/:id", userStoreController.getById);

userStoreRouter.get("/nearby", userStoreController.getAllSortedByDistance);

export default userStoreRouter;
