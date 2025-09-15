import express from "express";
import { protectSuperAdmin } from "../../../../middleware/adminAuth.middleware";
import adminAuthRouter from "./auth.admin.routes";

const adminRoutes: express.Router = express.Router();

// ===>  v1/admin/
adminRoutes.use("/auth", adminAuthRouter);

adminRoutes.use(protectSuperAdmin);

export default adminRoutes;
