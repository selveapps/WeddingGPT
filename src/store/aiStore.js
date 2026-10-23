import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandStorage } from '../services/storage';
import { aiService, toAIError, AI_ERROR_META } from '../services/ai';
import { analytics, AnalyticsEvents } from '../services/analytics';
import {
  createConversation,
  createMessage,
  createSuggestion,
  createTask,
  effectivePayload,
  deriveConversationTitle,
  buildWeddingContext,
  touchEntity,
  emptyCollection,
  upsert,
  removeById,
  removeManyById,
  denormalise,
  deriveFromCollection,
  MessageRole,
  MessageStatus,
  SuggestionStatus,
  SuggestionType,
  deviceActionReply,
} from '../models';
import { useWeddingStore } from './weddingStore';
import { usePlanningStore } from './planningStore';
import { useBudgetStore } from './budgetStore';
import { useGuestStore } from './guestStore';

/**
 * The assistant's controller (PRD s.14: UI -> AI state -> AIService -> provider).
 *
 * Owns conversations, messages and suggestions, and is the only place that
 * talks to `aiService`. Three rules it enforces:
 *
 *  1. **The AI never writes to the workspace.** A reply that proposes a change
 *     becomes a Suggestion. Only `confirmSuggestion`, called from an explicit
 *     user tap after review, creates real records (s.13).
 *  2. **Nothing is lost.** Conversations persist (s.14). A reply interrupted by
 *     the app closing is marked failed on the next launch, so it can be retried
 *     rather than sitting on "thinking" forever.
 *  3. **Context, not the database.** Each turn sends `buildWeddingContext` -
 *     counts and totals - never raw guest records. Requests like "mark the
 *     Smiths as attending" need the guest list, so they are understood on the
 *     phone (`deviceActionReply`) and never reach a provider at all.
 *
 * While a reply is being revealed, its growing text lives in `streaming`, which
 * is not persisted: writing to disk on every word would be wasteful, and the
 * finished text is written once when the reveal completes.
 */

/** Pace of the progressive reveal. Capped so long answers never make you wait. */
const REVEAL = { tickMs: 24, maxMs: 1600 };

const initialState = {
  conversations: emptyCollection(),
  messages: emptyCollection(),
  suggestions: emptyCollection(),
  /** messageId -> partially revealed text. In memory only. */
  streaming: {},
};

function gatherContext() {
  const { wedding } = useWeddingStore.getState();
  const planning = usePlanningStore.getState();
  const budget = useBudgetStore.getState();
  const guests = useGuestStore.getState();
  return buildWeddingContext({
    wedding,
    tasks: denormalise(planning.tasks),
    expenses: denormalise(budget.expenses),
    budgetTotal: budget.budget?.total ?? 0,
    guests: denormalise(guests.guests),
  });
}

/** A reply for a plain request ("add a $2,000 florist expense"), made on the phone, or null. */
function deviceReply(history) {
  const latest = history.at(-1);
  if (latest?.role !== MessageRole.USER) return null;
  const reply = deviceActionReply(latest.content, {
    guests: denormalise(useGuestStore.getState().guests),
    categories: denormalise(useBudgetStore.getState().categories),
  });
  return reply ? { ...reply, metadata: { provider: 'device', intent: 'action', latencyMs: 0 } } : null;
}

/** The conversation as the provider sees it: completed turns only, oldest first. */
function historyFor(state, conversationId, uptoMessageId) {
  const turns = [];
  for (const id of state.messages.allIds) {
    const message = state.messages.byId[id];
    if (message.conversationId !== conversationId) continue;
    if (id === uptoMessageId) break;
    if (message.role === MessageRole.ASSISTANT && message.status !== MessageStatus.COMPLETE) continue;
    turns.push({ role: message.role, content: message.content });
  }
  return turns;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const useAIStore = create()(
  persist(
    (set, get) => {
      const patchMessage = (id, patch) =>
        set((state) => {
          const existing = state.messages.byId[id];
          return existing ? { messages: upsert(state.messages, touchEntity(existing, patch)) } : {};
        });

      /** Reveal text word by word, then write it once. */
      async function reveal(messageId, text) {
        const words = text.split(/(\s+)/);
        const perTick = Math.max(1, Math.ceil(words.length / (REVEAL.maxMs / REVEAL.tickMs)));
        patchMessage(messageId, { status: MessageStatus.STREAMING });
        for (let i = perTick; i < words.length; i += perTick) {
          set((state) => ({ streaming: { ...state.streaming, [messageId]: words.slice(0, i).join('') } }));
          await sleep(REVEAL.tickMs);
        }
        set((state) => {
          const streaming = { ...state.streaming };
          delete streaming[messageId];
          return { streaming };
        });
      }

      /** Ask the provider for the reply that belongs in `assistantId`. */
      async function runTurn(conversationId, assistantId) {
        const history = historyFor(get(), conversationId, assistantId);
        const context = gatherContext();

        try {
          const reply = deviceReply(history) ?? (await aiService.reply({ messages: history, context }));

          let suggestionIds = [];
          if (reply.proposal) {
            const suggestion = createSuggestion({
              conversationId,
              messageId: assistantId,
              weddingId: useWeddingStore.getState().wedding?.id ?? null,
              type: reply.proposal.type,
              title: reply.proposal.title,
              summary: reply.proposal.summary ?? '',
              payload: reply.proposal.payload,
            });
            set((state) => ({ suggestions: upsert(state.suggestions, suggestion) }));
            suggestionIds = [suggestion.id];
          }

          await reveal(assistantId, reply.content);
          patchMessage(assistantId, {
            content: reply.content,
            status: MessageStatus.COMPLETE,
            suggestionIds,
            metadata: reply.metadata,
            error: null,
          });
          set((state) => {
            const conversation = state.conversations.byId[conversationId];
            if (!conversation) return {};
            return {
              conversations: upsert(
                state.conversations,
                touchEntity(conversation, {
                  lastMessageAt: new Date().toISOString(),
                  messageCount: (conversation.messageCount ?? 0) + 1,
                })
              ),
            };
          });

          analytics.track(AnalyticsEvents.AI_RESPONSE_GENERATED, {
            provider: reply.metadata?.provider,
            intent: reply.metadata?.intent,
            fellBack: Boolean(reply.metadata?.fellBack),
            hasProposal: Boolean(reply.proposal),
            latencyMs: reply.metadata?.latencyMs,
          });
        } catch (thrown) {
          const error = toAIError(thrown);
          patchMessage(assistantId, {
            status: MessageStatus.FAILED,
            error: {
              code: error.code,
              message: error.message,
              retryable: AI_ERROR_META[error.code]?.retryable ?? true,
            },
          });
          analytics.track(AnalyticsEvents.AI_RESPONSE_FAILED, { code: error.code });
        }
      }

      return {
        ...initialState,

        /**
         * Send a message. Creates the conversation on the first message and
         * returns its ID immediately, so the screen can navigate before the
         * reply arrives.
         */
        sendMessage({ conversationId = null, text }) {
          const content = String(text ?? '').trim();
          if (!content) return conversationId;

          let convId = conversationId;
          if (!convId || !get().conversations.byId[convId]) {
            const conversation = createConversation({
              weddingId: useWeddingStore.getState().wedding?.id ?? null,
              userId: useWeddingStore.getState().user?.id ?? null,
              title: deriveConversationTitle(content),
            });
            convId = conversation.id;
            set((state) => ({ conversations: upsert(state.conversations, conversation) }));
            analytics.track(AnalyticsEvents.AI_CONVERSATION_STARTED, { provider: aiService.mode });
          }

          const userMessage = createMessage({ conversationId: convId, role: MessageRole.USER, content });
          const assistantMessage = createMessage({
            conversationId: convId,
            role: MessageRole.ASSISTANT,
            status: MessageStatus.PENDING,
          });
          set((state) => ({
            messages: upsert(upsert(state.messages, userMessage), assistantMessage),
          }));
          analytics.track(AnalyticsEvents.AI_MESSAGE_SENT, { length: content.length });

          runTurn(convId, assistantMessage.id);
          return convId;
        },

        retry(assistantMessageId) {
          const message = get().messages.byId[assistantMessageId];
          if (!message || message.status !== MessageStatus.FAILED) return;
          patchMessage(assistantMessageId, { status: MessageStatus.PENDING, error: null });
          analytics.track(AnalyticsEvents.AI_RESPONSE_RETRIED, { code: message.error?.code });
          runTurn(message.conversationId, assistantMessageId);
        },

        /** Record the couple's edits to a proposal before they confirm it. */
        editSuggestion(id, editedPayload) {
          const existing = get().suggestions.byId[id];
          if (!existing) return;
          set((state) => ({
            suggestions: upsert(
              state.suggestions,
              touchEntity(existing, { editedPayload, status: SuggestionStatus.EDITED })
            ),
          }));
        },

        /**
         * Apply a suggestion to the workspace. The one path by which the AI's
         * output becomes real data, and only ever from an explicit user tap.
         * Returns `{ ok, count }` so the screen can confirm what happened.
         */
        confirmSuggestion(id, editedPayload) {
          const existing = get().suggestions.byId[id];
          if (!existing || existing.status === SuggestionStatus.CONFIRMED) return { ok: false, count: 0 };

          const edited = editedPayload !== undefined && editedPayload !== existing.payload;
          const suggestion = edited ? { ...existing, editedPayload } : existing;
          const payload = effectivePayload(suggestion);
          let count = 0;

          if (suggestion.type === SuggestionType.CREATE_TASKS) {
            const weddingId = useWeddingStore.getState().wedding?.id ?? null;
            const planning = usePlanningStore.getState();
            const categories = denormalise(planning.categories);
            const tasks = (payload.tasks ?? [])
              .filter((task) => task.title?.trim())
              .map((task) =>
                createTask({
                  weddingId,
                  title: task.title.trim(),
                  dueDate: task.dueDate ?? null,
                  categoryId: categories.find((c) => c.key === task.categoryKey)?.id ?? null,
                  description: 'Suggested by WeddingGPT',
                })
              );
            planning.addTasks(tasks);
            count = tasks.length;
            tasks.forEach((task) =>
              analytics.track(AnalyticsEvents.TASK_CREATED, { categoryId: task.categoryId, source: 'ai' })
            );
          } else if (suggestion.type === SuggestionType.ADD_EXPENSE) {
            const amount = Math.max(0, Math.round(Number(payload.amount) || 0));
            if (!payload.title?.trim() || !amount) return { ok: false, count: 0 };
            useBudgetStore.getState().addExpense({
              weddingId: useWeddingStore.getState().wedding?.id ?? null,
              title: payload.title.trim(),
              amount,
              paidAmount: Math.min(amount, Math.max(0, Math.round(Number(payload.paidAmount) || 0))),
              paymentStatus: payload.paymentStatus,
              commitment: payload.commitment,
              budgetCategoryId: payload.budgetCategoryId ?? null,
              date: payload.date ?? null,
              dueDate: payload.dueDate ?? null,
              notes: 'Added from the assistant',
            });
            count = 1;
          } else if (suggestion.type === SuggestionType.UPDATE_GUEST) {
            const guests = useGuestStore.getState();
            // Only guests still on the list: one may have been deleted since the proposal.
            const ids = (payload.guestIds ?? []).filter((guestId) => guests.guests.byId[guestId]);
            if (!ids.length || !payload.rsvpStatus) return { ok: false, count: 0 };
            ids.forEach((guestId) => guests.setRsvp(guestId, payload.rsvpStatus));
            count = ids.length;
          }

          set((state) => ({
            suggestions: upsert(
              state.suggestions,
              touchEntity(suggestion, { status: SuggestionStatus.CONFIRMED, confirmedAt: new Date().toISOString() })
            ),
          }));
          analytics.track(AnalyticsEvents.AI_SUGGESTION_CONFIRMED, { type: suggestion.type, edited, count });
          if (edited) analytics.track(AnalyticsEvents.AI_SUGGESTION_EDITED, { type: suggestion.type });
          return { ok: true, count };
        },

        discardSuggestion(id) {
          const existing = get().suggestions.byId[id];
          if (!existing) return;
          set((state) => ({
            suggestions: upsert(state.suggestions, touchEntity(existing, { status: SuggestionStatus.DISCARDED })),
          }));
          analytics.track(AnalyticsEvents.AI_SUGGESTION_DISCARDED, { type: existing.type });
        },

        deleteConversation(id) {
          const state = get();
          const messageIds = state.messages.allIds.filter((m) => state.messages.byId[m].conversationId === id);
          const suggestionIds = state.suggestions.allIds.filter(
            (s) => state.suggestions.byId[s].conversationId === id
          );
          set({
            conversations: removeById(state.conversations, id),
            messages: removeManyById(state.messages, messageIds),
            suggestions: removeManyById(state.suggestions, suggestionIds),
          });
        },

        reset() {
          set({ ...initialState });
        },
      };
    },
    {
      name: 'ai:store',
      storage: zustandStorage,
      version: 1,
      partialize: (state) => ({
        conversations: state.conversations,
        messages: state.messages,
        suggestions: state.suggestions,
      }),
      /**
       * A reply that was in flight when the app closed will never finish. Mark
       * it failed so the chat offers Retry instead of thinking forever.
       */
      merge: (persisted, current) => {
        const messages = persisted?.messages ?? current.messages;
        const byId = { ...messages.byId };
        for (const id of messages.allIds) {
          const message = byId[id];
          if (message?.status === MessageStatus.PENDING || message?.status === MessageStatus.STREAMING) {
            byId[id] = {
              ...message,
              status: MessageStatus.FAILED,
              error: { code: 'interrupted', message: 'This reply was interrupted. Tap retry.', retryable: true },
            };
          }
        }
        return { ...current, ...persisted, messages: { ...messages, byId }, streaming: {} };
      },
    }
  )
);

// --- Selectors ---------------------------------------------------------------

const newestFirst = deriveFromCollection((items) =>
  [...items].sort((a, b) =>
    (b.lastMessageAt ?? b.updatedAt ?? '').localeCompare(a.lastMessageAt ?? a.updatedAt ?? '')
  )
);

export const selectConversations = (state) => newestFirst(state.conversations);
export const selectConversationById = (id) => (state) => state.conversations.byId[id] ?? null;
export const selectMessageCollection = (state) => state.messages;
export const selectSuggestionById = (id) => (state) => (id ? state.suggestions.byId[id] ?? null : null);
export const selectStreamingText = (id) => (state) => state.streaming[id];
