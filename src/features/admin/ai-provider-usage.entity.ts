import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

export enum AiProviderUsageStatus {
  SUCCESS = "success",
  ERROR = "error",
}

/**
 * One row per real provider call attempt (including individual retries).
 * Metadata only — request/response text is NEVER stored here, consistent
 * with this table's purpose as usage/health telemetry, not conversation data.
 */
@Entity({ name: "ai_provider_usage" })
@Index(["provider", "model"])
@Index(["createdAt"])
export class AiProviderUsage {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 50 })
  provider!: string;

  @Column({ type: "varchar", length: 100 })
  model!: string;

  @Column({ type: "varchar", length: 36, name: "conversation_id", nullable: true })
  conversationId!: string | null;

  @Column({ type: "varchar", length: 36, name: "user_id", nullable: true })
  userId!: string | null;

  @Column({ type: "enum", enum: AiProviderUsageStatus })
  status!: AiProviderUsageStatus;

  @Column({ type: "varchar", length: 50, name: "error_type", nullable: true })
  errorType!: string | null;

  @Column({ type: "int", name: "input_tokens", nullable: true })
  inputTokens!: number | null;

  @Column({ type: "int", name: "output_tokens", nullable: true })
  outputTokens!: number | null;

  @Column({ type: "int", name: "total_tokens", nullable: true })
  totalTokens!: number | null;

  @Column({ type: "int", name: "latency_ms" })
  latencyMs!: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
