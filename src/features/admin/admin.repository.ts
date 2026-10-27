import { AppDataSource } from "../../database/data-source";
import { User } from "../auth/user.entity";
import { Conversation } from "../conversations/conversation.entity";
import { Message } from "../conversations/message.entity";
import { KnowledgeEntry } from "../knowledge/knowledge-entry.entity";
import { KnowledgeDocument } from "../documents/knowledge-document.entity";

const userRepo = () => AppDataSource.getRepository(User);
const conversationRepo = () => AppDataSource.getRepository(Conversation);
const messageRepo = () => AppDataSource.getRepository(Message);
const knowledgeRepo = () => AppDataSource.getRepository(KnowledgeEntry);
const documentRepo = () => AppDataSource.getRepository(KnowledgeDocument);

interface RawUserRow {
  id: string;
  name: string;
  email: string;
  role: User["role"];
  isVerified: number | boolean;
  createdAt: Date;
  conversationCount: string;
}

export const AdminRepository = {
  async countUsers(): Promise<number> {
    return userRepo().count();
  },

  async countConversations(): Promise<number> {
    return conversationRepo().count();
  },

  async countKnowledgeEntries(): Promise<number> {
    return knowledgeRepo().count();
  },

  async countDocuments(): Promise<number> {
    return documentRepo().count();
  },

  /**
   * All users with their conversation count, computed via a single grouped
   * LEFT JOIN (not one COUNT query per user).
   */
  async listUsersWithConversationCount(): Promise<
    Array<{
      id: string;
      name: string;
      email: string;
      role: User["role"];
      isVerified: boolean;
      createdAt: Date;
      conversationCount: number;
    }>
  > {
    const rows = await userRepo()
      .createQueryBuilder("user")
      .leftJoin(Conversation, "conversation", "conversation.user_id = user.id")
      .select("user.id", "id")
      .addSelect("user.name", "name")
      .addSelect("user.email", "email")
      .addSelect("user.role", "role")
      .addSelect("user.isVerified", "isVerified")
      .addSelect("user.createdAt", "createdAt")
      .addSelect("COUNT(conversation.id)", "conversationCount")
      .groupBy("user.id")
      .orderBy("user.createdAt", "DESC")
      .getRawMany<RawUserRow>();

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      isVerified: Boolean(row.isVerified),
      createdAt: row.createdAt,
      conversationCount: Number(row.conversationCount),
    }));
  },

  async findUserById(userId: string): Promise<User | null> {
    return userRepo().findOne({ where: { id: userId } });
  },

  /**
   * A given user's conversations with per-conversation message counts, via a
   * single grouped LEFT JOIN scoped by `userId` (never a global query).
   */
  async listConversationsForUserWithMessageCount(
    userId: string
  ): Promise<Array<{ id: string; title: string | null; createdAt: Date; updatedAt: Date; messageCount: number }>> {
    const rows = await conversationRepo()
      .createQueryBuilder("conversation")
      .leftJoin(Message, "message", "message.conversation_id = conversation.id")
      .select("conversation.id", "id")
      .addSelect("conversation.title", "title")
      .addSelect("conversation.createdAt", "createdAt")
      .addSelect("conversation.updatedAt", "updatedAt")
      .addSelect("COUNT(message.id)", "messageCount")
      .where("conversation.user_id = :userId", { userId })
      .groupBy("conversation.id")
      .orderBy("conversation.updatedAt", "DESC")
      .getRawMany<{ id: string; title: string | null; createdAt: Date; updatedAt: Date; messageCount: string }>();

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      messageCount: Number(row.messageCount),
    }));
  },

  /**
   * Scoped by (id, userId) always — mirrors ConversationsRepository.findByIdForUser
   * so a conversationId alone can never resolve to a different user's data.
   */
  async findConversationForUser(conversationId: string, userId: string): Promise<Conversation | null> {
    return conversationRepo().findOne({ where: { id: conversationId, userId } });
  },

  async listMessagesForConversation(conversationId: string): Promise<Message[]> {
    return messageRepo().find({
      where: { conversationId },
      order: { createdAt: "ASC" },
    });
  },
};
