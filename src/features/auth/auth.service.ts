import { AuthRepository } from "./auth.repository";
import { OtpPurpose } from "./otp.entity";
import { AppError } from "../../utils/AppError";
import { hashPassword, comparePassword } from "../../utils/password";
import { generateOpaqueToken, sha256Hash, signAccessToken } from "../../utils/token";
import { generateOtp, hashOtp } from "../../utils/otp";
import { EmailService } from "../../utils/email";
import { PublicUser } from "./auth.types";
import {
  OTP_EXPIRES_IN_MINUTES,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
  RESET_TOKEN_BYTES,
  RESET_TOKEN_EXPIRES_IN_MINUTES,
  SESSION_TOKEN_BYTES,
} from "../../config/constants";
import { env } from "../../config/env";
import { User } from "./user.entity";

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    isVerified: user.isVerified,
    role: user.role,
  };
}

function minutesFromNow(minutes: number): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function issueOtp(email: string, purpose: OtpPurpose): Promise<void> {
  // Invalidate any still-active OTPs for this email+purpose so only the newest is valid.
  await AuthRepository.invalidateActiveOtps(email, purpose);

  const code = generateOtp();
  await AuthRepository.createOtp({
    email,
    purpose,
    codeHash: hashOtp(code),
    expiresAt: minutesFromNow(OTP_EXPIRES_IN_MINUTES),
    maxAttempts: OTP_MAX_ATTEMPTS,
  });

  await EmailService.sendOtpEmail(email, code, purpose);
}

export const AuthService = {
  async signup(input: { name: string; email: string; password: string }): Promise<{ email: string }> {
    const existing = await AuthRepository.findUserByEmail(input.email);
    if (existing) {
      throw new AppError(409, "EMAIL_ALREADY_EXISTS", "An account with this email already exists");
    }

    const passwordHash = await hashPassword(input.password);
    const user = await AuthRepository.createUser({ name: input.name, email: input.email, passwordHash });

    await issueOtp(user.email, OtpPurpose.SIGNUP_VERIFICATION);

    return { email: user.email };
  },

  async verifyOtp(input: {
    email: string;
    code: string;
    purpose: OtpPurpose;
  }): Promise<{ verified: true; resetToken?: string }> {
    const user = await AuthRepository.findUserByEmail(input.email);
    if (!user) {
      throw new AppError(404, "NOT_FOUND", "Invalid or expired code");
    }

    const otp = await AuthRepository.findActiveOtp(input.email, input.purpose);
    if (!otp) {
      throw new AppError(400, "OTP_INVALID", "Invalid or expired code");
    }

    if (otp.expiresAt.getTime() < Date.now()) {
      throw new AppError(410, "OTP_EXPIRED", "Code has expired, please request a new one");
    }

    if (otp.attempts >= otp.maxAttempts) {
      throw new AppError(429, "OTP_MAX_ATTEMPTS", "Too many attempts, please request a new code");
    }

    const codeHash = hashOtp(input.code);
    if (codeHash !== otp.codeHash) {
      await AuthRepository.incrementOtpAttempts(otp.id);
      throw new AppError(400, "OTP_INVALID", "Invalid or expired code");
    }

    await AuthRepository.consumeOtp(otp.id);

    if (input.purpose === OtpPurpose.SIGNUP_VERIFICATION) {
      await AuthRepository.markUserVerified(user.id);
      return { verified: true };
    }

    // PASSWORD_RESET: issue an opaque, hashed, short-lived reset token.
    const resetToken = generateOpaqueToken(RESET_TOKEN_BYTES);
    await AuthRepository.createResetToken({
      userId: user.id,
      tokenHash: sha256Hash(resetToken),
      expiresAt: minutesFromNow(RESET_TOKEN_EXPIRES_IN_MINUTES),
    });

    return { verified: true, resetToken };
  },

  async resendOtp(input: { email: string; purpose: OtpPurpose }): Promise<void> {
    const user = await AuthRepository.findUserByEmail(input.email);
    if (!user) {
      // Do not reveal whether the account exists.
      return;
    }

    const latest = await AuthRepository.findLatestOtp(input.email, input.purpose);
    if (latest) {
      const secondsSinceCreated = (Date.now() - latest.createdAt.getTime()) / 1000;
      if (secondsSinceCreated < OTP_RESEND_COOLDOWN_SECONDS) {
        throw new AppError(429, "RATE_LIMITED", "Please wait before requesting another code");
      }
    }

    await issueOtp(input.email, input.purpose);
  },

  async login(input: { email: string; password: string }): Promise<{ user: PublicUser; accessToken: string; sessionToken: string }> {
    const user = await AuthRepository.findUserByEmail(input.email);
    if (!user) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
    }

    const passwordMatches = await comparePassword(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
    }

    if (!user.isVerified) {
      throw new AppError(403, "ACCOUNT_NOT_VERIFIED", "Please verify your email before logging in");
    }

    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const sessionToken = generateOpaqueToken(SESSION_TOKEN_BYTES);
    await AuthRepository.createSession({
      userId: user.id,
      tokenHash: sha256Hash(sessionToken),
      expiresAt: daysFromNow(env.session.expiresInDays),
    });

    return { user: toPublicUser(user), accessToken, sessionToken };
  },

  async refresh(sessionToken: string): Promise<{ accessToken: string; newSessionToken: string }> {
    const tokenHash = sha256Hash(sessionToken);
    const session = await AuthRepository.findSessionByTokenHash(tokenHash);

    if (!session) {
      throw new AppError(401, "UNAUTHORIZED", "Session is invalid, please log in again");
    }

    if (session.revokedAt) {
      // Reuse of a revoked token indicates possible theft: revoke everything for this user.
      await AuthRepository.revokeAllSessionsForUser(session.userId);
      throw new AppError(401, "UNAUTHORIZED", "Session is invalid, please log in again");
    }

    if (session.expiresAt.getTime() < Date.now()) {
      throw new AppError(401, "UNAUTHORIZED", "Session has expired, please log in again");
    }

    const user = await AuthRepository.findUserById(session.userId);
    if (!user) {
      throw new AppError(401, "UNAUTHORIZED", "Session is invalid, please log in again");
    }

    // Rotate: revoke old session, issue a new one.
    await AuthRepository.revokeSession(session.id);
    const newSessionToken = generateOpaqueToken(SESSION_TOKEN_BYTES);
    await AuthRepository.createSession({
      userId: user.id,
      tokenHash: sha256Hash(newSessionToken),
      expiresAt: daysFromNow(env.session.expiresInDays),
    });

    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    return { accessToken, newSessionToken };
  },

  async logout(sessionToken: string | undefined): Promise<void> {
    if (!sessionToken) {
      return;
    }
    const tokenHash = sha256Hash(sessionToken);
    const session = await AuthRepository.findSessionByTokenHash(tokenHash);
    if (session && !session.revokedAt) {
      await AuthRepository.revokeSession(session.id);
    }
  },

  async me(userId: string): Promise<PublicUser> {
    const user = await AuthRepository.findUserById(userId);
    if (!user) {
      throw new AppError(401, "UNAUTHORIZED", "User not found");
    }
    return toPublicUser(user);
  },

  async forgotPassword(email: string): Promise<void> {
    const user = await AuthRepository.findUserByEmail(email);
    if (!user || !user.isVerified) {
      // Never reveal whether the account exists.
      return;
    }
    await issueOtp(email, OtpPurpose.PASSWORD_RESET);
  },

  async resetPassword(input: {
    email: string;
    resetToken: string;
    password: string;
  }): Promise<void> {
    const user = await AuthRepository.findUserByEmail(input.email);
    if (!user) {
      throw new AppError(400, "RESET_TOKEN_INVALID", "Invalid or expired reset token");
    }

    const tokenHash = sha256Hash(input.resetToken);
    const resetToken = await AuthRepository.findValidResetToken(tokenHash);
    if (!resetToken || resetToken.userId !== user.id) {
      throw new AppError(400, "RESET_TOKEN_INVALID", "Invalid or expired reset token");
    }

    const passwordHash = await hashPassword(input.password);
    await AuthRepository.updateUserPassword(user.id, passwordHash);
    await AuthRepository.consumeResetToken(resetToken.id);
    await AuthRepository.revokeAllSessionsForUser(user.id);
  },

  async changePassword(input: {
    userId: string;
    currentSessionToken: string | undefined;
    currentPassword: string;
    newPassword: string;
  }): Promise<void> {
    const user = await AuthRepository.findUserById(input.userId);
    if (!user) {
      throw new AppError(401, "UNAUTHORIZED", "User not found");
    }

    const passwordMatches = await comparePassword(input.currentPassword, user.passwordHash);
    if (!passwordMatches) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Current password is incorrect");
    }

    const passwordHash = await hashPassword(input.newPassword);
    await AuthRepository.updateUserPassword(user.id, passwordHash);

    if (input.currentSessionToken) {
      const currentSession = await AuthRepository.findSessionByTokenHash(sha256Hash(input.currentSessionToken));
      if (currentSession) {
        await AuthRepository.revokeAllOtherSessions(user.id, currentSession.id);
        return;
      }
    }

    await AuthRepository.revokeAllSessionsForUser(user.id);
  },
};
