import express from "express";
import { UsersAdminController } from "../../controllers/admin/users.admin.controller";

const usersAdminController = new UsersAdminController();
const usersAdminRouter = express.Router();

usersAdminRouter.get("/", usersAdminController.getAllUsers);
usersAdminRouter.patch("/:id", usersAdminController.toggleUserStatus);

export default usersAdminRouter;
