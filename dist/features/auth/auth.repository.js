"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRepository = void 0;
const typeorm_1 = require("typeorm");
const data_source_1 = require("../../database/data-source");
const user_entity_1 = require("./user.entity");
const session_entity_1 = require("./session.entity");
const otp_entity_1 = require("./otp.entity");
const reset_token_entity_1 = require("./reset-token.entity");
const userRepo = () => data_source_1.AppDataSource.getRepository(user_entity_1.User);
const sessionRepo = () => data_source_1.AppDataSource.getRepository(session_entity_1.AuthSession);
const otpRepo = () => data_source_1.AppDataSource.getRepository(otp_entity_1.OtpVerification);
const resetTokenRepo = () => data_source_1.AppDataSource.getRepository(reset_token_entity_1.PasswordResetToken);
exports.AuthRepository = {
    // --- Users ---
    async findUserByEmail(email) {
        return userRepo().findOne({ where: { email } });
    },
    async findUserById(id) {
        return userRepo().findOne({ where: { id } });
    },
    async createUser(data) {
        const user = userRepo().create(data);
        return userRepo().save(user);
    },
    async markUserVerified(userId) {
        await userRepo().update({ id: userId }, { isVerified: true });
    },
    async updateUserPassword(userId, passwordHash) {
        await userRepo().update({ id: userId }, { passwordHash });
    },
    // --- OTP ---
    async createOtp(data) {
        const otp = otpRepo().create(data);
        return otpRepo().save(otp);
    },
    /** Latest active (unconsumed) OTP for an email + purpose. */
    async findActiveOtp(email, purpose) {
        return otpRepo().findOne({
            where: { email, purpose, consumedAt: (0, typeorm_1.IsNull)() },
            order: { createdAt: "DESC" },
        });
    },
    async findLatestOtp(email, purpose) {
        return otpRepo().findOne({
            where: { email, purpose },
            order: { createdAt: "DESC" },
        });
    },
    async incrementOtpAttempts(id) {
        await otpRepo().increment({ id }, "attempts", 1);
    },
    async consumeOtp(id) {
        await otpRepo().update({ id }, { consumedAt: new Date() });
    },
    async invalidateActiveOtps(email, purpose) {
        await otpRepo().update({ email, purpose, consumedAt: (0, typeorm_1.IsNull)() }, { consumedAt: new Date() });
    },
    // --- Sessions ---
    async createSession(data) {
        const session = sessionRepo().create(data);
        return sessionRepo().save(session);
    },
    async findSessionByTokenHash(tokenHash) {
        return sessionRepo().findOne({ where: { tokenHash } });
    },
    async revokeSession(id) {
        await sessionRepo().update({ id }, { revokedAt: new Date() });
    },
    async revokeAllSessionsForUser(userId) {
        await sessionRepo().update({ userId, revokedAt: (0, typeorm_1.IsNull)() }, { revokedAt: new Date() });
    },
    async revokeAllOtherSessions(userId, exceptSessionId) {
        await sessionRepo()
            .createQueryBuilder()
            .update(session_entity_1.AuthSession)
            .set({ revokedAt: new Date() })
            .where("userId = :userId AND id != :exceptSessionId AND revokedAt IS NULL", {
            userId,
            exceptSessionId,
        })
            .execute();
    },
    // --- Password reset tokens ---
    async createResetToken(data) {
        const token = resetTokenRepo().create(data);
        return resetTokenRepo().save(token);
    },
    async findValidResetToken(tokenHash) {
        return resetTokenRepo().findOne({
            where: { tokenHash, consumedAt: (0, typeorm_1.IsNull)(), expiresAt: (0, typeorm_1.MoreThan)(new Date()) },
        });
    },
    async consumeResetToken(id) {
        await resetTokenRepo().update({ id }, { consumedAt: new Date() });
    },
    async invalidateUnusedResetTokensForUser(userId) {
        await resetTokenRepo()
            .createQueryBuilder()
            .update(reset_token_entity_1.PasswordResetToken)
            .set({ consumedAt: new Date() })
            .where("userId = :userId AND consumedAt IS NULL AND expiresAt > :now", { userId, now: new Date() })
            .execute();
    },
};
//# sourceMappingURL=auth.repository.js.map