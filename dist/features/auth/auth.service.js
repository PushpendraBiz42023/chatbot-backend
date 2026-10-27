"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const auth_repository_1 = require("./auth.repository");
const otp_entity_1 = require("./otp.entity");
const AppError_1 = require("../../utils/AppError");
const password_1 = require("../../utils/password");
const token_1 = require("../../utils/token");
const otp_1 = require("../../utils/otp");
const email_1 = require("../../utils/email");
const constants_1 = require("../../config/constants");
const env_1 = require("../../config/env");
function toPublicUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        role: user.role,
    };
}
function minutesFromNow(minutes) {
    return new Date(Date.now() + minutes * 60 * 1000);
}
function daysFromNow(days) {
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
async function issueOtp(email, purpose) {
    // Invalidate any still-active OTPs for this email+purpose so only the newest is valid.
    await auth_repository_1.AuthRepository.invalidateActiveOtps(email, purpose);
    const code = (0, otp_1.generateOtp)();
    await auth_repository_1.AuthRepository.createOtp({
        email,
        purpose,
        codeHash: (0, otp_1.hashOtp)(code),
        expiresAt: minutesFromNow(constants_1.OTP_EXPIRES_IN_MINUTES),
        maxAttempts: constants_1.OTP_MAX_ATTEMPTS,
    });
    await email_1.EmailService.sendOtpEmail(email, code, purpose);
}
exports.AuthService = {
    async signup(input) {
        const existing = await auth_repository_1.AuthRepository.findUserByEmail(input.email);
        if (existing) {
            throw new AppError_1.AppError(409, "EMAIL_ALREADY_EXISTS", "An account with this email already exists");
        }
        const passwordHash = await (0, password_1.hashPassword)(input.password);
        const user = await auth_repository_1.AuthRepository.createUser({ name: input.name, email: input.email, passwordHash });
        await issueOtp(user.email, otp_entity_1.OtpPurpose.SIGNUP_VERIFICATION);
        return { email: user.email };
    },
    async verifyOtp(input) {
        const user = await auth_repository_1.AuthRepository.findUserByEmail(input.email);
        if (!user) {
            throw new AppError_1.AppError(404, "NOT_FOUND", "Invalid or expired code");
        }
        const otp = await auth_repository_1.AuthRepository.findActiveOtp(input.email, input.purpose);
        if (!otp) {
            throw new AppError_1.AppError(400, "OTP_INVALID", "Invalid or expired code");
        }
        if (otp.expiresAt.getTime() < Date.now()) {
            throw new AppError_1.AppError(410, "OTP_EXPIRED", "Code has expired, please request a new one");
        }
        if (otp.attempts >= otp.maxAttempts) {
            throw new AppError_1.AppError(429, "OTP_MAX_ATTEMPTS", "Too many attempts, please request a new code");
        }
        const codeHash = (0, otp_1.hashOtp)(input.code);
        if (codeHash !== otp.codeHash) {
            await auth_repository_1.AuthRepository.incrementOtpAttempts(otp.id);
            throw new AppError_1.AppError(400, "OTP_INVALID", "Invalid or expired code");
        }
        await auth_repository_1.AuthRepository.consumeOtp(otp.id);
        if (input.purpose === otp_entity_1.OtpPurpose.SIGNUP_VERIFICATION) {
            await auth_repository_1.AuthRepository.markUserVerified(user.id);
            return { verified: true };
        }
        // PASSWORD_RESET: issue an opaque, hashed, short-lived reset token.
        const resetToken = (0, token_1.generateOpaqueToken)(constants_1.RESET_TOKEN_BYTES);
        await auth_repository_1.AuthRepository.createResetToken({
            userId: user.id,
            tokenHash: (0, token_1.sha256Hash)(resetToken),
            expiresAt: minutesFromNow(constants_1.RESET_TOKEN_EXPIRES_IN_MINUTES),
        });
        return { verified: true, resetToken };
    },
    async resendOtp(input) {
        const user = await auth_repository_1.AuthRepository.findUserByEmail(input.email);
        if (!user) {
            // Do not reveal whether the account exists.
            return;
        }
        const latest = await auth_repository_1.AuthRepository.findLatestOtp(input.email, input.purpose);
        if (latest) {
            const secondsSinceCreated = (Date.now() - latest.createdAt.getTime()) / 1000;
            if (secondsSinceCreated < constants_1.OTP_RESEND_COOLDOWN_SECONDS) {
                throw new AppError_1.AppError(429, "RATE_LIMITED", "Please wait before requesting another code");
            }
        }
        await issueOtp(input.email, input.purpose);
    },
    async login(input) {
        const user = await auth_repository_1.AuthRepository.findUserByEmail(input.email);
        if (!user) {
            throw new AppError_1.AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
        }
        const passwordMatches = await (0, password_1.comparePassword)(input.password, user.passwordHash);
        if (!passwordMatches) {
            throw new AppError_1.AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
        }
        if (!user.isVerified) {
            throw new AppError_1.AppError(403, "ACCOUNT_NOT_VERIFIED", "Please verify your email before logging in");
        }
        const accessToken = (0, token_1.signAccessToken)({ sub: user.id, email: user.email });
        const sessionToken = (0, token_1.generateOpaqueToken)(constants_1.SESSION_TOKEN_BYTES);
        await auth_repository_1.AuthRepository.createSession({
            userId: user.id,
            tokenHash: (0, token_1.sha256Hash)(sessionToken),
            expiresAt: daysFromNow(env_1.env.session.expiresInDays),
        });
        return { user: toPublicUser(user), accessToken, sessionToken };
    },
    async refresh(sessionToken) {
        const tokenHash = (0, token_1.sha256Hash)(sessionToken);
        const session = await auth_repository_1.AuthRepository.findSessionByTokenHash(tokenHash);
        if (!session) {
            throw new AppError_1.AppError(401, "UNAUTHORIZED", "Session is invalid, please log in again");
        }
        if (session.revokedAt) {
            // Reuse of a revoked token indicates possible theft: revoke everything for this user.
            await auth_repository_1.AuthRepository.revokeAllSessionsForUser(session.userId);
            throw new AppError_1.AppError(401, "UNAUTHORIZED", "Session is invalid, please log in again");
        }
        if (session.expiresAt.getTime() < Date.now()) {
            throw new AppError_1.AppError(401, "UNAUTHORIZED", "Session has expired, please log in again");
        }
        const user = await auth_repository_1.AuthRepository.findUserById(session.userId);
        if (!user) {
            throw new AppError_1.AppError(401, "UNAUTHORIZED", "Session is invalid, please log in again");
        }
        // Rotate: revoke old session, issue a new one.
        await auth_repository_1.AuthRepository.revokeSession(session.id);
        const newSessionToken = (0, token_1.generateOpaqueToken)(constants_1.SESSION_TOKEN_BYTES);
        await auth_repository_1.AuthRepository.createSession({
            userId: user.id,
            tokenHash: (0, token_1.sha256Hash)(newSessionToken),
            expiresAt: daysFromNow(env_1.env.session.expiresInDays),
        });
        const accessToken = (0, token_1.signAccessToken)({ sub: user.id, email: user.email });
        return { accessToken, newSessionToken };
    },
    async logout(sessionToken) {
        if (!sessionToken) {
            return;
        }
        const tokenHash = (0, token_1.sha256Hash)(sessionToken);
        const session = await auth_repository_1.AuthRepository.findSessionByTokenHash(tokenHash);
        if (session && !session.revokedAt) {
            await auth_repository_1.AuthRepository.revokeSession(session.id);
        }
    },
    async me(userId) {
        const user = await auth_repository_1.AuthRepository.findUserById(userId);
        if (!user) {
            throw new AppError_1.AppError(401, "UNAUTHORIZED", "User not found");
        }
        return toPublicUser(user);
    },
    async forgotPassword(email) {
        const user = await auth_repository_1.AuthRepository.findUserByEmail(email);
        if (!user || !user.isVerified) {
            // Never reveal whether the account exists.
            return;
        }
        await issueOtp(email, otp_entity_1.OtpPurpose.PASSWORD_RESET);
    },
    async resetPassword(input) {
        const user = await auth_repository_1.AuthRepository.findUserByEmail(input.email);
        if (!user) {
            throw new AppError_1.AppError(400, "RESET_TOKEN_INVALID", "Invalid or expired reset token");
        }
        const tokenHash = (0, token_1.sha256Hash)(input.resetToken);
        const resetToken = await auth_repository_1.AuthRepository.findValidResetToken(tokenHash);
        if (!resetToken || resetToken.userId !== user.id) {
            throw new AppError_1.AppError(400, "RESET_TOKEN_INVALID", "Invalid or expired reset token");
        }
        const passwordHash = await (0, password_1.hashPassword)(input.password);
        await auth_repository_1.AuthRepository.updateUserPassword(user.id, passwordHash);
        await auth_repository_1.AuthRepository.consumeResetToken(resetToken.id);
        await auth_repository_1.AuthRepository.revokeAllSessionsForUser(user.id);
    },
    async changePassword(input) {
        const user = await auth_repository_1.AuthRepository.findUserById(input.userId);
        if (!user) {
            throw new AppError_1.AppError(401, "UNAUTHORIZED", "User not found");
        }
        const passwordMatches = await (0, password_1.comparePassword)(input.currentPassword, user.passwordHash);
        if (!passwordMatches) {
            throw new AppError_1.AppError(401, "INVALID_CREDENTIALS", "Current password is incorrect");
        }
        const passwordHash = await (0, password_1.hashPassword)(input.newPassword);
        await auth_repository_1.AuthRepository.updateUserPassword(user.id, passwordHash);
        if (input.currentSessionToken) {
            const currentSession = await auth_repository_1.AuthRepository.findSessionByTokenHash((0, token_1.sha256Hash)(input.currentSessionToken));
            if (currentSession) {
                await auth_repository_1.AuthRepository.revokeAllOtherSessions(user.id, currentSession.id);
                return;
            }
        }
        await auth_repository_1.AuthRepository.revokeAllSessionsForUser(user.id);
    },
};
//# sourceMappingURL=auth.service.js.map