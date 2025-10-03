import express from "express";
import AuthController from "../../controllers/user/auth.user.controller";

const userAuthRouter: express.Router = express.Router();
const authController = new AuthController();

// Login
userAuthRouter.post("/login", authController.login);

// OTP-based registration
userAuthRouter.post("/register/send-otp", authController.sendRegistrationOtp);
userAuthRouter.post(
  "/register/verify-otp",
  authController.verifyRegistrationOtp
);

// Forgot password
userAuthRouter.post(
  "/forgot-password/send-otp",
  authController.sendForgotPasswordOtp
);
userAuthRouter.post(
  "/forgot-password/verify-otp",
  authController.verifyForgotPasswordOtp
);
userAuthRouter.post(
  "/forgot-password/reset-password",
  authController.resetPassword
);

export default userAuthRouter;
