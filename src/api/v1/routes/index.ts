import express from "express";
import adminRoutes from "./admin/auth.admin.routes";
import publicRoutes from "./public/public.routes";
import userRoutes from "./user/user.routes";

const v1Routes: express.Router = express.Router();

v1Routes.use("/admin", adminRoutes);
v1Routes.use("/user", userRoutes);
v1Routes.use("/public", publicRoutes);

export default v1Routes;
