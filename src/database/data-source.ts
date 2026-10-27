import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "../config/env";
import { User } from "../features/auth/user.entity";
import { AuthSession } from "../features/auth/session.entity";
import { OtpVerification } from "../features/auth/otp.entity";
import { PasswordResetToken } from "../features/auth/reset-token.entity";
import { Conversation } from "../features/conversations/conversation.entity";
import { Message } from "../features/conversations/message.entity";
import { KnowledgeEntry } from "../features/knowledge/knowledge-entry.entity";
import { KnowledgeChunk } from "../features/knowledge/knowledge-chunk.entity";
import { KnowledgeDocument } from "../features/documents/knowledge-document.entity";
import { AiProviderUsage } from "../features/admin/ai-provider-usage.entity";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: env.db.host,
  port: env.db.port,
  username: env.db.username,
  password: env.db.password,
  database: env.db.database,
  charset: "utf8mb4_unicode_ci",
  synchronize: false,
  logging: false,
  entities: [
    User,
    AuthSession,
    OtpVerification,
    PasswordResetToken,
    Conversation,
    Message,
    KnowledgeEntry,
    KnowledgeChunk,
    KnowledgeDocument,
    AiProviderUsage,
  ],
  migrations: [__dirname + "/migrations/*.{ts,js}"],
});
