import { createEntity } from './base';
import { MessageRole, MessageStatus, SuggestionType, SuggestionStatus } from './enums';

/**
 * AI conversations, messages and proposed changes.
 *
 * The `AISuggestion` type is the spine of PRD s.13: the AI never writes to the
 * workspace. It emits a suggestion, the UI renders it as an editable preview,
 * and only an explicit confirmation turns `payload` into real entities. The
 * status field records that journey - including when the user edited the
 * proposal before accepting it, which is worth knowing when judging how good
 * the suggestions actually are.
 */

export function createConversation({ weddingId, userId = null, title = 'New conversation' } = {}) {
  return createEntity('conv', {
    weddingId,
    userId,
    title,
    lastMessageAt: null,
    messageCount: 0,
  });
}

export function createMessage({
  conversationId,
  role = MessageRole.USER,
  content = '',
  status = MessageStatus.COMPLETE,
  /** Suggestion IDs attached to this message. */
  suggestionIds = [],
  /** Provider, model, token counts, latency - useful for debugging and cost. */
  metadata = {},
} = {}) {
  return createEntity('msg', {
    conversationId,
    role,
    content,
    status,
    suggestionIds,
    metadata,
    error: null,
  });
}

export function createSuggestion({
  conversationId,
  messageId,
  weddingId,
  type = SuggestionType.CREATE_TASKS,
  title = '',
  summary = '',
  /** The proposed change, shaped by `type`. Never applied until confirmed. */
  payload = {},
} = {}) {
  return createEntity('sugg', {
    conversationId,
    messageId,
    weddingId,
    type,
    title,
    summary,
    payload,
    status: SuggestionStatus.PROPOSED,
    confirmedAt: null,
    /** Set when the user changes the proposal before accepting it. */
    editedPayload: null,
  });
}

/** The payload that should actually be applied - the user's edit wins. */
export function effectivePayload(suggestion) {
  return suggestion?.editedPayload ?? suggestion?.payload ?? {};
}

export function isSuggestionPending(suggestion) {
  return (
    suggestion?.status === SuggestionStatus.PROPOSED ||
    suggestion?.status === SuggestionStatus.EDITED
  );
}

/**
 * Derive a conversation title from its first user message.
 * Conversations are far easier to find later by their opening question than by
 * a timestamp, and asking the model to name it would cost a round trip.
 */
export function deriveConversationTitle(firstUserMessage = '') {
  const cleaned = firstUserMessage.trim().replace(/\s+/g, ' ');
  if (!cleaned) return 'New conversation';
  if (cleaned.length <= 48) return cleaned;
  return `${cleaned.slice(0, 45).trimEnd()}...`;
}
