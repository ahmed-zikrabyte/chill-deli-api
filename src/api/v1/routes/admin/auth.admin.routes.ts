import express from "express";
import AdminAuthController from "../../controllers/admin/auth.admin.controller";

const router = express.Router();
const authCtrl = new AdminAuthController();

router.post("/register", authCtrl.register);
router.post("/login", authCtrl.login);

export default router;
