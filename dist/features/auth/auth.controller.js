"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const apiResponse_1 = require("../../utils/apiResponse");
const AppError_1 = require("../../utils/AppError");
const constants_1 = require("../../config/constants");
const auth_validation_1 = require("./auth.validation");
function setSessionCookie(res, token) {
    res.cookie(constants_1.COOKIE_OPTIONS.name, token, {
        httpOnly: constants_1.COOKIE_OPTIONS.httpOnly,
        secure: constants_1.COOKIE_OPTIONS.secure,
        sameSite: constants_1.COOKIE_OPTIONS.sameSite,
        path: constants_1.COOKIE_OPTIONS.path,
        maxAge: constants_1.COOKIE_OPTIONS.maxAge,
    });
}
function clearSessionCookie(res) {
    res.clearCookie(constants_1.COOKIE_OPTIONS.name, {
        httpOnly: constants_1.COOKIE_OPTIONS.httpOnly,
        secure: constants_1.COOKIE_OPTIONS.secure,
        sameSite: constants_1.COOKIE_OPTIONS.sameSite,
        path: constants_1.COOKIE_OPTIONS.path,
    });
}
exports.AuthController = {
    async signup(req, res, next) {
        try {
            const input = auth_validation_1.signupSchema.parse(req.body);
            const result = await auth_service_1.AuthService.signup(input);
            (0, apiResponse_1.sendSuccess)(res, 201, "Account created. Please verify your email.", { email: result.email });
        }
        catch (error) {
            next(error);
        }
    },
    async verifyOtp(req, res, next) {
        try {
            const input = auth_validation_1.verifyOtpSchema.parse(req.body);
            const result = await auth_service_1.AuthService.verifyOtp(input);
            (0, apiResponse_1.sendSuccess)(res, 200, "Verified", result);
        }
        catch (error) {
            next(error);
        }
    },
    async resendOtp(req, res, next) {
        try {
            const input = auth_validation_1.resendOtpSchema.parse(req.body);
            await auth_service_1.AuthService.resendOtp(input);
            (0, apiResponse_1.sendSuccess)(res, 200, "If an account exists, a new code has been sent.");
        }
        catch (error) {
            next(error);
        }
    },
    async login(req, res, next) {
        try {
            const input = auth_validation_1.loginSchema.parse(req.body);
            const result = await auth_service_1.AuthService.login(input);
            setSessionCookie(res, result.sessionToken);
            (0, apiResponse_1.sendSuccess)(res, 200, "Login successful", {
                user: result.user,
                accessToken: result.accessToken,
            });
        }
        catch (error) {
            next(error);
        }
    },
    async refresh(req, res, next) {
        try {
            const sessionToken = req.cookies?.[constants_1.COOKIE_OPTIONS.name];
            if (!sessionToken) {
                throw new AppError_1.AppError(401, "UNAUTHORIZED", "No active session");
            }
            const result = await auth_service_1.AuthService.refresh(sessionToken);
            setSessionCookie(res, result.newSessionToken);
            (0, apiResponse_1.sendSuccess)(res, 200, "Token refreshed", { accessToken: result.accessToken });
        }
        catch (error) {
            next(error);
        }
    },
    async me(req, res, next) {
        try {
            const user = await auth_service_1.AuthService.me(req.userId);
            (0, apiResponse_1.sendSuccess)(res, 200, "OK", { user });
        }
        catch (error) {
            next(error);
        }
    },
    async logout(req, res, next) {
        try {
            const sessionToken = req.cookies?.[constants_1.COOKIE_OPTIONS.name];
            await auth_service_1.AuthService.logout(sessionToken);
            clearSessionCookie(res);
            (0, apiResponse_1.sendSuccess)(res, 200, "Logged out");
        }
        catch (error) {
            next(error);
        }
    },
    async forgotPassword(req, res, next) {
        try {
            const input = auth_validation_1.forgotPasswordSchema.parse(req.body);
            await auth_service_1.AuthService.forgotPassword(input.email);
            (0, apiResponse_1.sendSuccess)(res, 200, "If an account exists, a verification code has been sent.");
        }
        catch (error) {
            next(error);
        }
    },
    async resetPassword(req, res, next) {
        try {
            const input = auth_validation_1.resetPasswordSchema.parse(req.body);
            await auth_service_1.AuthService.resetPassword(input);
            (0, apiResponse_1.sendSuccess)(res, 200, "Password has been reset. Please log in.");
        }
        catch (error) {
            next(error);
        }
    },
    async changePassword(req, res, next) {
        try {
            const input = auth_validation_1.changePasswordSchema.parse(req.body);
            const sessionToken = req.cookies?.[constants_1.COOKIE_OPTIONS.name];
            await auth_service_1.AuthService.changePassword({
                userId: req.userId,
                currentSessionToken: sessionToken,
                currentPassword: input.currentPassword,
                newPassword: input.newPassword,
            });
            (0, apiResponse_1.sendSuccess)(res, 200, "Password changed");
        }
        catch (error) {
            next(error);
        }
    },
};
//# sourceMappingURL=auth.controller.js.map