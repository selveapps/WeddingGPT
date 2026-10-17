/**
 * Intent matching for the on-device assistant.
 *
 * Deliberately simple and inspectable: every intent declares regex `patterns`
 * (strong signals, +3 each) and weighted `keywords` (weak signals, matched on
 * word starts so "budgeting" counts for "budget"). The highest score above the
 * threshold wins. A 60-intent keyword model is not a language model, but it is
 * predictable, instant, free and works on a plane - which is exactly the job
 * the fallback provider has.
 */

const PATTERN_WEIGHT = 3;
const THRESHOLD = 2;

export function normalise(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[’']/g, '')
    // Hyphens become spaces so "no-children" and "to-do" match "no children", "to do".
    .replace(/[^a-z0-9₹$€£%\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreIntent(intent, text, words) {
  let score = 0;
  for (const pattern of intent.patterns ?? []) {
    if (pattern.test(text)) score += PATTERN_WEIGHT;
  }
  for (const [keyword, weight] of Object.entries(intent.keywords ?? {})) {
    if (keyword.includes(' ')) {
      if (text.includes(keyword)) score += weight;
    } else if (words.some((word) => word.startsWith(keyword))) {
      score += weight;
    }
  }
  return score;
}

/**
 * Rank intents for a message. Returns the best `{ intent, score }` or null.
 * `priority` breaks ties so a specific intent ("draft an RSVP reminder") beats
 * a broad one ("rsvp") when both score the same.
 */
export function matchIntent(intents, rawText) {
  const text = normalise(rawText);
  if (!text) return null;
  const words = text.split(' ');

  let best = null;
  for (const intent of intents) {
    const score = scoreIntent(intent, text, words) + (intent.priority ?? 0) * 0.01;
    if (score >= THRESHOLD && (!best || score > best.score)) best = { intent, score };
  }
  return best;
}

/**
 * Resolve a message in the light of the conversation. Short follow-ups ("and
 * for the photographer?", "tell me more") rarely carry an intent on their own,
 * so when the new message does not match, we retry against it joined with the
 * previous user message.
 */
export function resolveIntent(intents, messages) {
  const users = messages.filter((m) => m.role === 'user');
  const current = users[users.length - 1]?.content ?? '';
  const direct = matchIntent(intents, current);
  if (direct) return { ...direct, text: current, current };

  const previous = users[users.length - 2]?.content;
  if (previous && normalise(current).split(' ').length <= 6) {
    const combined = matchIntent(intents, `${previous} ${current}`);
    if (combined) return { ...combined, text: `${previous} ${current}`, current, followUp: true };
  }
  return null;
}
