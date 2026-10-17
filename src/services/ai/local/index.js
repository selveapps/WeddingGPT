import { workspaceIntents } from './intents/workspace';
import { knowledgeIntents } from './intents/knowledge';
import { actionIntents } from './intents/actions';
import { supportIntents } from './intents/support';
import { resolveIntent, normalise } from './match';
import { bullets } from './helpers';

/**
 * The on-device assistant provider.
 *
 * Answers from a curated knowledge base plus the couple's own wedding context.
 * It is the default when no remote model is configured, and the fallback when
 * the remote one is unreachable - so the assistant tab never dead-ends on a
 * plane or a bad connection.
 *
 * It is honest about its range: anything it does not recognise gets a clear
 * "here is what I can help with" rather than a confident guess.
 */

export const LOCAL_INTENTS = [...actionIntents, ...workspaceIntents, ...supportIntents, ...knowledgeIntents];

const FALLBACK = {
  content: `I am not sure I understood that one - I am the on-device assistant, so I work best with wedding-planning questions. Try asking:\n\n${bullets([
    '"What should we do next?"',
    '"How much budget is left?"',
    '"Make a checklist for booking a photographer"',
    '"Draft an RSVP reminder"',
    '"Is it okay to have an adults-only wedding?"',
    '"How do I add a guest?"',
  ])}`,
};

/** Short pause so answers do not snap in faster than a person could type the question. */
const THINK_MS = { min: 450, max: 900 };

export function createLocalProvider({ intents = LOCAL_INTENTS, think = THINK_MS } = {}) {
  return {
    name: 'local',

    async reply({ messages, context }) {
      const started = Date.now();
      const resolved = resolveIntent(intents, messages);

      let result = FALLBACK;
      if (resolved) {
        try {
          result =
            resolved.intent.answer(context ?? {}, normalise(resolved.text), normalise(resolved.current)) ??
            FALLBACK;
        } catch (error) {
          // A bad template must never break the chat - log it and fall back.
          if (__DEV__) console.warn(`[ai:local] intent "${resolved.intent.id}" threw`, error);
          result = FALLBACK;
        }
      }

      const delay = think.min + Math.random() * (think.max - think.min);
      await new Promise((resolve) => setTimeout(resolve, delay));

      return {
        content: result.content,
        proposal: result.proposal ?? null,
        metadata: {
          provider: 'local',
          intent: resolved?.intent.id ?? 'fallback',
          latencyMs: Date.now() - started,
        },
      };
    },
  };
}

export default createLocalProvider;
