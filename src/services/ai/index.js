import { createLocalProvider } from './local';
import { createRemoteProvider } from './remoteProvider';
import { toAIError, isFallbackWorthy } from './AIService';

export { AIError, AIErrorCode, AI_ERROR_META, toAIError } from './AIService';
export { createLocalProvider } from './local';
export { createRemoteProvider } from './remoteProvider';
export { PROMPT_TEMPLATES, PROMPT_GROUPS } from './promptTemplates';

/**
 * The AIService the app uses.
 *
 * With `EXPO_PUBLIC_AI_PROXY_URL` set, questions go to Claude through the
 * proxy, and the on-device assistant answers only when the proxy cannot be
 * reached - offline, timed out, or down. Without it, the on-device assistant
 * answers everything. Swapping providers never touches a screen.
 *
 * Rate limits and declines are *not* sent to the fallback: those are real
 * answers from the service, and papering over them would hide them.
 */
export function createAIService({ primary, fallback = null }) {
  return {
    get mode() {
      return primary.name;
    },

    async reply(request) {
      try {
        return await primary.reply(request);
      } catch (thrown) {
        const error = toAIError(thrown);
        if (!fallback || fallback === primary || !isFallbackWorthy(error)) throw error;
        const reply = await fallback.reply(request);
        return { ...reply, metadata: { ...reply.metadata, fellBack: true, fallbackReason: error.code } };
      }
    },
  };
}

const local = createLocalProvider();
const proxyUrl = process.env.EXPO_PUBLIC_AI_PROXY_URL;

export const aiService = proxyUrl
  ? createAIService({
      primary: createRemoteProvider({ url: proxyUrl, appToken: process.env.EXPO_PUBLIC_AI_APP_TOKEN }),
      fallback: local,
    })
  : createAIService({ primary: local });

export default aiService;
