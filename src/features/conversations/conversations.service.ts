import { AppError } from "../../utils/AppError";
import { ConversationsRepository } from "./conversations.repository";
import { Conversation } from "./conversation.entity";
import { Message, MessageRole } from "./message.entity";
import { ConversationDto, MessageDto } from "./conversations.types";
import { getModelForProvider, isProviderConfigured, isValidProviderName } from "../../services/ai/provider-manager";

const TITLE_MAX_LENGTH = 60;

/**
 * Deterministic title from the first user message: trim, collapse internal
 * whitespace, cap at ~60 chars with an ellipsis. No AI call — out of scope.
 */
export function deriveTitleFromMessage(message: string): string {
  const collapsed = message.trim().replace(/\s+/g, " ");
  if (collapsed.length <= TITLE_MAX_LENGTH) {
    return collapsed;
  }
  return `${collapsed.slice(0, TITLE_MAX_LENGTH)}…`;
}

function toConversationDto(conversation: Conversation): ConversationDto {
  return {
    id: conversation.id,
    title: conversation.title,
    activeProvider: conversation.activeProvider,
    activeModel: conversation.activeModel,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
}

function toMessageDto(message: Message): MessageDto {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
  };
}

async function getOwnedConversationOrThrow(id: string, userId: string): Promise<Conversation> {
  const conversation = await ConversationsRepository.findByIdForUser(id, userId);
  if (!conversation) {
    // Never 403: an existing-but-not-yours conversation must look identical to a
    // nonexistent one, so we don't leak the existence of other users' data.
    throw new AppError(404, "NOT_FOUND", "Conversation not found");
  }
  return conversation;
}

export const ConversationsService = {
  async list(userId: string): Promise<ConversationDto[]> {
    const conversations = await ConversationsRepository.listForUser(userId);
    return conversations.map(toConversationDto);
  },

  async create(userId: string): Promise<ConversationDto> {
    const conversation = await ConversationsRepository.createConversation(userId);
    return toConversationDto(conversation);
  },

  async getOne(id: string, userId: string): Promise<ConversationDto> {
    const conversation = await getOwnedConversationOrThrow(id, userId);
    return toConversationDto(conversation);
  },

  async getMessages(id: string, userId: string): Promise<MessageDto[]> {
    await getOwnedConversationOrThrow(id, userId);
    const messages = await ConversationsRepository.listMessagesForConversation(id);
    return messages.map(toMessageDto);
  },

  async rename(id: string, userId: string, title: string): Promise<ConversationDto> {
    await getOwnedConversationOrThrow(id, userId);
    const updated = await ConversationsRepository.renameConversation(id, title);
    return toConversationDto(updated);
  },

  async remove(id: string, userId: string): Promise<void> {
    await getOwnedConversationOrThrow(id, userId);
    await ConversationsRepository.deleteConversation(id);
  },

  /**
   * Metadata-only write: switches which AI provider this conversation's next
   * chat turn will use. conversationId, messages, and history are untouched.
   * Never trusts the client's provider string beyond validating it against
   * the fixed enum AND confirming it currently has a configured API key —
   * the model always comes from server config, never the client.
   */
  async switchProvider(id: string, userId: string, provider: string): Promise<ConversationDto> {
    await getOwnedConversationOrThrow(id, userId);

    if (!isValidProviderName(provider) || !isProviderConfigured(provider)) {
      throw new AppError(400, "VALIDATION_ERROR", "That provider is not available.");
    }

    const model = getModelForProvider(provider);
    const updated = await ConversationsRepository.setActiveProvider(id, provider, model);
    return toConversationDto(updated);
  },
};

export { MessageRole };
