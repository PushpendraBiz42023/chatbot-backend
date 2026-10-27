"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.loginSchema = exports.resendOtpSchema = exports.verifyOtpSchema = exports.otpPurposeSchema = exports.signupSchema = void 0;
const zod_1 = require("zod");
const otp_entity_1 = require("./otp.entity");
const passwordSchema = zod_1.z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a digit")
    .regex(/[^A-Za-z0-9]/, "Password must contain a special character");
const emailSchema = zod_1.z.string().trim().toLowerCase().email("Invalid email address");
exports.signupSchema = zod_1.z
    .object({
    name: zod_1.z.string().trim().min(2, "Name must be at least 2 characters").max(60, "Name must be at most 60 characters"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: zod_1.z.string(),
})
    .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});
exports.otpPurposeSchema = zod_1.z.nativeEnum(otp_entity_1.OtpPurpose);
exports.verifyOtpSchema = zod_1.z.object({
    email: emailSchema,
    code: zod_1.z.string().trim().length(6, "Code must be 6 digits").regex(/^\d{6}$/, "Code must be numeric"),
    purpose: exports.otpPurposeSchema,
});
exports.resendOtpSchema = zod_1.z.object({
    email: emailSchema,
    purpose: exports.otpPurposeSchema,
});
exports.loginSchema = zod_1.z.object({
    email: emailSchema,
    password: zod_1.z.string().min(1, "Password is required"),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: emailSchema,
});
exports.resetPasswordSchema = zod_1.z
    .object({
    email: emailSchema,
    resetToken: zod_1.z.string().min(1, "Reset token is required"),
    password: passwordSchema,
    confirmPassword: zod_1.z.string(),
})
    .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});
exports.changePasswordSchema = zod_1.z
    .object({
    currentPassword: zod_1.z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmNewPassword: zod_1.z.string(),
})
    .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
});
//# sourceMappingURL=auth.validation.js.map