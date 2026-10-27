import { Router } from "express";
import { AuthController } from "./auth.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import {
  loginRateLimiter,
  signupRateLimiter,
  otpResendRateLimiter,
  forgotPasswordRateLimiter,
  resetPasswordRateLimiter,
  verifyOtpRateLimiter,
} from "../../middleware/rateLimit.middleware";

const router = Router();

router.post("/signup", signupRateLimiter, AuthController.signup);
router.post("/verify-otp", verifyOtpRateLimiter, AuthController.verifyOtp);
router.post("/resend-otp", otpResendRateLimiter, AuthController.resendOtp);
router.post("/login", loginRateLimiter, AuthController.login);
router.post("/refresh", AuthController.refresh);
router.get("/me", authMiddleware, AuthController.me);
router.post("/logout", AuthController.logout);
router.post("/forgot-password", forgotPasswordRateLimiter, AuthController.forgotPassword);
router.post("/reset-password", resetPasswordRateLimiter, AuthController.resetPassword);
router.post("/change-password", authMiddleware, AuthController.changePassword);

export { router as authRoutes };
