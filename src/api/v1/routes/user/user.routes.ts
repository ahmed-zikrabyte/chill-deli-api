import express from "express";
import { protectUser } from "../../../../middleware/userAuth.middleware";
import userAuthRouter from "./auth.user.routes";

const adminRoutes: express.Router = express.Router();

// ===>  v1/admin/
adminRoutes.use("/auth", userAuthRouter);

adminRoutes.use(protectUser);

export default adminRoutes;
