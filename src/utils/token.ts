import crypto from "crypto";
import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export interface AccessTokenPayload {
  sub: string;
  email: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  const options: SignOptions = {
    expiresIn: env.jwt.accessExpiresIn as SignOptions["expiresIn"],
    algorithm: "HS256",
    jwtid: crypto.randomUUID(),
  };
  return jwt.sign(payload, env.jwt.secret, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload & { iat: number; exp: number; jti: string } {
  return jwt.verify(token, env.jwt.secret, { algorithms: ["HS256"] }) as AccessTokenPayload & {
    iat: number;
    exp: number;
    jti: string;
  };
}

/** Generates an opaque, URL-safe random token (used for sessions and reset tokens). */
export function generateOpaqueToken(byteLength: number): string {
  return crypto.randomBytes(byteLength).toString("base64url");
}

/** Hashes an opaque token with SHA-256 before persisting it, so raw tokens never touch the DB. */
export function sha256Hash(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}
