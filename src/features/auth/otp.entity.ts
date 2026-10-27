import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

export enum OtpPurpose {
  SIGNUP_VERIFICATION = "SIGNUP_VERIFICATION",
  PASSWORD_RESET = "PASSWORD_RESET",
}

@Entity({ name: "otp_verifications" })
@Index(["email", "purpose"])
export class OtpVerification {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  email!: string;

  @Column({ type: "enum", enum: OtpPurpose })
  purpose!: OtpPurpose;

  @Column({ type: "varchar", length: 64, name: "code_hash" })
  codeHash!: string;

  @Column({ type: "datetime", name: "expires_at" })
  expiresAt!: Date;

  @Column({ type: "int", default: 0 })
  attempts!: number;

  @Column({ type: "int", default: 5, name: "max_attempts" })
  maxAttempts!: number;

  @Column({ type: "datetime", name: "consumed_at", nullable: true })
  consumedAt!: Date | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
