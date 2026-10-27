import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import { sendSuccess } from "../../utils/apiResponse";
import { AppError } from "../../utils/AppError";
import { COOKIE_OPTIONS } from "../../config/constants";
import {
  signupSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "./auth.validation";

function setSessionCookie(res: Response, token: string): void {
  res.cookie(COOKIE_OPTIONS.name, token, {
    httpOnly: COOKIE_OPTIONS.httpOnly,
    secure: COOKIE_OPTIONS.secure,
    sameSite: COOKIE_OPTIONS.sameSite,
    path: COOKIE_OPTIONS.path,
    maxAge: COOKIE_OPTIONS.maxAge,
  });
}

function clearSessionCookie(res: Response): void {
  res.clearCookie(COOKIE_OPTIONS.name, {
    httpOnly: COOKIE_OPTIONS.httpOnly,
    secure: COOKIE_OPTIONS.secure,
    sameSite: COOKIE_OPTIONS.sameSite,
    path: COOKIE_OPTIONS.path,
  });
}

export const AuthController = {
  async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = signupSchema.parse(req.body);
      const result = await AuthService.signup(input);
      sendSuccess(res, 201, "Account created. Please verify your email.", { email: result.email });
    } catch (error) {
      next(error);
    }
  },

  async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = verifyOtpSchema.parse(req.body);
      const result = await AuthService.verifyOtp(input);
      sendSuccess(res, 200, "Verified", result);
    } catch (error) {
      next(error);
    }
  },

  async resendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = resendOtpSchema.parse(req.body);
      await AuthService.resendOtp(input);
      sendSuccess(res, 200, "If an account exists, a new code has been sent.");
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = loginSchema.parse(req.body);
      const result = await AuthService.login(input);
      setSessionCookie(res, result.sessionToken);
      sendSuccess(res, 200, "Login successful", {
        user: result.user,
        accessToken: result.accessToken,
      });
    } catch (error) {
      next(error);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionToken = req.cookies?.[COOKIE_OPTIONS.name] as string | undefined;
      if (!sessionToken) {
        throw new AppError(401, "UNAUTHORIZED", "No active session");
      }
      const result = await AuthService.refresh(sessionToken);
      setSessionCookie(res, result.newSessionToken);
      sendSuccess(res, 200, "Token refreshed", { accessToken: result.accessToken });
    } catch (error) {
      next(error);
    }
  },

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await AuthService.me(req.userId as string);
      sendSuccess(res, 200, "OK", { user });
    } catch (error) {
      next(error);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionToken = req.cookies?.[COOKIE_OPTIONS.name] as string | undefined;
      await AuthService.logout(sessionToken);
      clearSessionCookie(res);
      sendSuccess(res, 200, "Logged out");
    } catch (error) {
      next(error);
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = forgotPasswordSchema.parse(req.body);
      await AuthService.forgotPassword(input.email);
      sendSuccess(res, 200, "If an account exists, a verification code has been sent.");
    } catch (error) {
      next(error);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = resetPasswordSchema.parse(req.body);
      await AuthService.resetPassword(input);
      sendSuccess(res, 200, "Password has been reset. Please log in.");
    } catch (error) {
      next(error);
    }
  },

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = changePasswordSchema.parse(req.body);
      const sessionToken = req.cookies?.[COOKIE_OPTIONS.name] as string | undefined;
      await AuthService.changePassword({
        userId: req.userId as string,
        currentSessionToken: sessionToken,
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
      });
      sendSuccess(res, 200, "Password changed");
    } catch (error) {
      next(error);
    }
  },
};
