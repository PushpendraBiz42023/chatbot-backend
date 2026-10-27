import { AppDataSource } from "../../database/data-source";
import { Conversation } from "./conversation.entity";
import { Message, MessageRole } from "./message.entity";

const conversationRepo = () => AppDataSource.getRepository(Conversation);
const messageRepo = () => AppDataSource.getRepository(Message);

export const ConversationsRepository = {
  async createConversation(userId: string): Promise<Conversation> {
    const conversation = conversationRepo().create({ userId, title: null });
    return conversationRepo().save(conversation);
  },

  /** Scoped by (id, userId) always — never look up by id alone. */
  async findByIdForUser(id: string, userId: string): Promise<Conversation | null> {
    return conversationRepo().findOne({ where: { id, userId } });
  },

  async listForUser(userId: string): Promise<Conversation[]> {
    return conversationRepo().find({
      where: { userId },
      order: { updatedAt: "DESC" },
    });
  },

  async renameConversation(id: string, title: string): Promise<Conversation> {
    await conversationRepo().update({ id }, { title });
    // Re-fetch so the caller gets the fresh updatedAt set by @UpdateDateColumn.
    const updated = await conversationRepo().findOne({ where: { id } });
    if (!updated) {
      throw new Error(`Conversation ${id} disappeared during rename`);
    }
    return updated;
  },

  async setActiveProvider(id: string, provider: string, model: string | null): Promise<Conversation> {
    await conversationRepo().update({ id }, { activeProvider: provider, activeModel: model });
    const updated = await conversationRepo().findOne({ where: { id } });
    if (!updated) {
      throw new Error(`Conversation ${id} disappeared during provider switch`);
    }
    return updated;
  },

  /** Sets activeModel to whatever model was actually used, only if not already set (first turn). */
  async setActiveModelIfMissing(id: string, model: string): Promise<void> {
    await conversationRepo()
      .createQueryBuilder()
      .update(Conversation)
      .set({ activeModel: model })
      .where("id = :id AND active_model IS NULL", { id })
      .execute();
  },

  async touch(id: string): Promise<void> {
    // Re-saving triggers @UpdateDateColumn even when no other field changes.
    await conversationRepo().save({ id, updatedAt: new Date() });
  },

  async setTitleIfMissing(id: string, title: string): Promise<void> {
    await conversationRepo()
      .createQueryBuilder()
      .update(Conversation)
      .set({ title })
      .where("id = :id AND title IS NULL", { id })
      .execute();
  },

  async deleteConversation(id: string): Promise<void> {
    await conversationRepo().delete({ id });
  },

  // --- Messages ---
  async addMessage(data: {
    conversationId: string;
    userId: string;
    role: MessageRole;
    content: string;
  }): Promise<Message> {
    const message = messageRepo().create(data);
    return messageRepo().save(message);
  },

  async listMessagesForConversation(conversationId: string): Promise<Message[]> {
    return messageRepo().find({
      where: { conversationId },
      order: { createdAt: "ASC" },
    });
  },

  /** Most recent `limit` messages for a conversation, ordered oldest-first (for prompt history). */
  async loadRecentHistory(conversationId: string, limit: number): Promise<Message[]> {
    const recent = await messageRepo().find({
      where: { conversationId },
      order: { createdAt: "DESC" },
      take: limit,
    });
    return recent.reverse();
  },
};
