import { AIError, AIErrorCode } from './AIService';

/**
 * Remote provider: talks to the WeddingGPT AI proxy (`server/ai-proxy`), which
 * holds the Anthropic API key and calls Claude.
 *
 * The app never sees the key. Anything bundled into a mobile app can be pulled
 * out of it, so the key lives on the server and the app sends only the
 * conversation plus the compact wedding context.
 *
 * The reply arrives in one piece: React Native's fetch cannot read a response
 * body as a stream, so the store reveals the text progressively instead.
 */

const DEFAULT_TIMEOUT_MS = 45000;
/** Enough history to follow a conversation, not so much that every turn gets slower. */
const MAX_HISTORY = 20;

export function createRemoteProvider({ url, appToken, timeoutMs = DEFAULT_TIMEOUT_MS }) {
  const endpoint = `${url.replace(/\/+$/, '')}/v1/chat`;

  return {
    name: 'remote',

    async reply({ messages, context }) {
      const started = Date.now();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      let response;
      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(appToken ? { 'X-App-Token': appToken } : {}),
          },
          body: JSON.stringify({
            messages: messages.slice(-MAX_HISTORY).map(({ role, content }) => ({ role, content })),
            context,
          }),
          signal: controller.signal,
        });
      } catch (error) {
        throw new AIError(error?.name === 'AbortError' ? AIErrorCode.TIMEOUT : AIErrorCode.OFFLINE);
      } finally {
        clearTimeout(timer);
      }

      if (!response.ok) {
        if (response.status === 429) throw new AIError(AIErrorCode.RATE_LIMITED);
        if (response.status === 422) throw new AIError(AIErrorCode.DECLINED);
        if (response.status >= 500) throw new AIError(AIErrorCode.UNAVAILABLE);
        throw new AIError(AIErrorCode.UNKNOWN);
      }

      const body = await response.json().catch(() => null);
      if (!body || typeof body.content !== 'string') throw new AIError(AIErrorCode.UNKNOWN);

      return {
        content: body.content,
        proposal: body.proposal ?? null,
        metadata: {
          provider: 'remote',
          model: body.model ?? null,
          latencyMs: Date.now() - started,
        },
      };
    },
  };
}

export default createRemoteProvider;
