/**
 * AIService - the contract every assistant provider satisfies (PRD s.14).
 *
 *   UI -> aiStore (controller) -> AIService -> provider
 *
 * A provider answers one turn. It is handed the conversation so far and the
 * structured wedding context, and resolves with a reply - optionally carrying
 * a *proposal*: a change the assistant would like to make to the workspace.
 * Providers never write to the workspace themselves. The store turns a
 * proposal into a suggestion the couple reviews, edits and confirms (s.13).
 *
 * @typedef {Object} AIRequest
 * @property {Array<{role: 'user'|'assistant', content: string}>} messages
 *           Oldest first. The last entry is the user's new message.
 * @property {Object} context   Output of `buildWeddingContext`.
 *
 * @typedef {Object} AIProposal
 * @property {'create_tasks'|'draft_message'} type   A `SuggestionType`.
 * @property {string} title
 * @property {string} [summary]
 * @property {Object} payload
 *
 * @typedef {Object} AIReply
 * @property {string} content          Markdown-lite: paragraphs, `- ` bullets, `**bold**`, `### ` headings.
 * @property {AIProposal|null} proposal
 * @property {Object} metadata         { provider, model?, latencyMs, fellBack? }
 *
 * @typedef {Object} AIProvider
 * @property {string} name
 * @property {(request: AIRequest) => Promise<AIReply>} reply
 */

export const AIErrorCode = {
  OFFLINE: 'offline',
  TIMEOUT: 'timeout',
  RATE_LIMITED: 'rate_limited',
  UNAVAILABLE: 'unavailable',
  DECLINED: 'declined',
  UNKNOWN: 'unknown',
};

/** Copy for each failure. Every one of them is paired with Retry in the UI. */
export const AI_ERROR_META = {
  [AIErrorCode.OFFLINE]: { message: 'You seem to be offline. Your question is saved - retry once you are connected.', retryable: true },
  [AIErrorCode.TIMEOUT]: { message: 'That took longer than it should. Give it another try.', retryable: true },
  [AIErrorCode.RATE_LIMITED]: { message: 'Lots of questions at once - wait a few seconds, then retry.', retryable: true },
  [AIErrorCode.UNAVAILABLE]: { message: 'The assistant is briefly unavailable. Retry in a moment.', retryable: true },
  [AIErrorCode.DECLINED]: { message: 'I cannot help with that one. Try asking it a different way.', retryable: false },
  [AIErrorCode.UNKNOWN]: { message: 'Something went wrong on our side. Your conversation is safe - try again.', retryable: true },
};

export class AIError extends Error {
  constructor(code = AIErrorCode.UNKNOWN, message) {
    super(message ?? AI_ERROR_META[code]?.message ?? AI_ERROR_META[AIErrorCode.UNKNOWN].message);
    this.name = 'AIError';
    this.code = code;
  }
}

export function toAIError(error) {
  if (error instanceof AIError) return error;
  if (__DEV__) console.warn('[ai] Unexpected failure', error);
  return new AIError(AIErrorCode.UNKNOWN);
}

/** Failures where a different provider might still answer. */
export function isFallbackWorthy(error) {
  return [AIErrorCode.OFFLINE, AIErrorCode.TIMEOUT, AIErrorCode.UNAVAILABLE].includes(error?.code);
}
