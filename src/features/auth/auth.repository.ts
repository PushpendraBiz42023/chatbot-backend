import { MoreThan, IsNull } from "typeorm";
import { AppDataSource } from "../../database/data-source";
import { User } from "./user.entity";
import { AuthSession } from "./session.entity";
import { OtpVerification, OtpPurpose } from "./otp.entity";
import { PasswordResetToken } from "./reset-token.entity";

const userRepo = () => AppDataSource.getRepository(User);
const sessionRepo = () => AppDataSource.getRepository(AuthSession);
const otpRepo = () => AppDataSource.getRepository(OtpVerification);
const resetTokenRepo = () => AppDataSource.getRepository(PasswordResetToken);

export const AuthRepository = {
  // --- Users ---
  async findUserByEmail(email: string): Promise<User | null> {
    return userRepo().findOne({ where: { email } });
  },

  async findUserById(id: string): Promise<User | null> {
    return userRepo().findOne({ where: { id } });
  },

  async createUser(data: { name: string; email: string; passwordHash: string }): Promise<User> {
    const user = userRepo().create(data);
    return userRepo().save(user);
  },

  async markUserVerified(userId: string): Promise<void> {
    await userRepo().update({ id: userId }, { isVerified: true });
  },

  async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    await userRepo().update({ id: userId }, { passwordHash });
  },

  // --- OTP ---
  async createOtp(data: {
    email: string;
    purpose: OtpPurpose;
    codeHash: string;
    expiresAt: Date;
    maxAttempts: number;
  }): Promise<OtpVerification> {
    const otp = otpRepo().create(data);
    return otpRepo().save(otp);
  },

  /** Latest active (unconsumed) OTP for an email + purpose. */
  async findActiveOtp(email: string, purpose: OtpPurpose): Promise<OtpVerification | null> {
    return otpRepo().findOne({
      where: { email, purpose, consumedAt: IsNull() },
      order: { createdAt: "DESC" },
    });
  },

  async findLatestOtp(email: string, purpose: OtpPurpose): Promise<OtpVerification | null> {
    return otpRepo().findOne({
      where: { email, purpose },
      order: { createdAt: "DESC" },
    });
  },

  async incrementOtpAttempts(id: string): Promise<void> {
    await otpRepo().increment({ id }, "attempts", 1);
  },

  async consumeOtp(id: string): Promise<void> {
    await otpRepo().update({ id }, { consumedAt: new Date() });
  },

  async invalidateActiveOtps(email: string, purpose: OtpPurpose): Promise<void> {
    await otpRepo().update({ email, purpose, consumedAt: IsNull() }, { consumedAt: new Date() });
  },

  // --- Sessions ---
  async createSession(data: { userId: string; tokenHash: string; expiresAt: Date }): Promise<AuthSession> {
    const session = sessionRepo().create(data);
    return sessionRepo().save(session);
  },

  async findSessionByTokenHash(tokenHash: string): Promise<AuthSession | null> {
    return sessionRepo().findOne({ where: { tokenHash } });
  },

  async revokeSession(id: string): Promise<void> {
    await sessionRepo().update({ id }, { revokedAt: new Date() });
  },

  async revokeAllSessionsForUser(userId: string): Promise<void> {
    await sessionRepo().update({ userId, revokedAt: IsNull() }, { revokedAt: new Date() });
  },

  async revokeAllOtherSessions(userId: string, exceptSessionId: string): Promise<void> {
    await sessionRepo()
      .createQueryBuilder()
      .update(AuthSession)
      .set({ revokedAt: new Date() })
      .where("userId = :userId AND id != :exceptSessionId AND revokedAt IS NULL", {
        userId,
        exceptSessionId,
      })
      .execute();
  },

  // --- Password reset tokens ---
  async createResetToken(data: { userId: string; tokenHash: string; expiresAt: Date }): Promise<PasswordResetToken> {
    const token = resetTokenRepo().create(data);
    return resetTokenRepo().save(token);
  },

  async findValidResetToken(tokenHash: string): Promise<PasswordResetToken | null> {
    return resetTokenRepo().findOne({
      where: { tokenHash, consumedAt: IsNull(), expiresAt: MoreThan(new Date()) },
    });
  },

  async consumeResetToken(id: string): Promise<void> {
    await resetTokenRepo().update({ id }, { consumedAt: new Date() });
  },

  async invalidateUnusedResetTokensForUser(userId: string): Promise<void> {
    await resetTokenRepo()
      .createQueryBuilder()
      .update(PasswordResetToken)
      .set({ consumedAt: new Date() })
      .where("userId = :userId AND consumedAt IS NULL AND expiresAt > :now", { userId, now: new Date() })
      .execute();
  },
};
