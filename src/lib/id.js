/**
 * Stable ID generation.
 *
 * Every entity in the app carries an opaque, stable ID (see PRD s.22 - display
 * names are never identifiers). IDs are prefixed by entity type purely so logs
 * and debugging sessions are readable; nothing parses them.
 *
 * The generator is a time-ordered ULID-style value: the leading timestamp means
 * IDs sort chronologically, which keeps list ordering stable and makes future
 * server-side conflict resolution easier than with random v4 UUIDs.
 */

const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford base32, no I/L/O/U
const ENCODING_LEN = ENCODING.length;
const TIME_LEN = 10;
const RANDOM_LEN = 16;

function encodeTime(now, len) {
  let str = '';
  let value = now;
  for (let i = len - 1; i >= 0; i--) {
    const mod = value % ENCODING_LEN;
    str = ENCODING[mod] + str;
    value = (value - mod) / ENCODING_LEN;
  }
  return str;
}

function encodeRandom(len) {
  let str = '';
  for (let i = 0; i < len; i++) {
    str += ENCODING[Math.floor(Math.random() * ENCODING_LEN)];
  }
  return str;
}

/** Monotonic guard so two IDs minted in the same millisecond never collide. */
let lastTime = 0;
let lastRandom = '';

function nextRandom(time) {
  if (time === lastTime) {
    // Increment the previous random block instead of re-rolling it.
    const chars = lastRandom.split('');
    let i = chars.length - 1;
    while (i >= 0) {
      const idx = ENCODING.indexOf(chars[i]);
      if (idx < ENCODING_LEN - 1) {
        chars[i] = ENCODING[idx + 1];
        break;
      }
      chars[i] = ENCODING[0];
      i--;
    }
    lastRandom = chars.join('');
  } else {
    lastTime = time;
    lastRandom = encodeRandom(RANDOM_LEN);
  }
  return lastRandom;
}

/** A bare, sortable, collision-resistant ID. */
export function ulid(now = Date.now()) {
  return encodeTime(now, TIME_LEN) + nextRandom(now);
}

/**
 * Create a prefixed entity ID, e.g. `createId('task')` -> `task_01J2X...`.
 * Prefixes are for human readability in logs only.
 */
export function createId(prefix) {
  return prefix ? `${prefix}_${ulid()}` : ulid();
}

/** Extract the creation timestamp encoded in an ID, or null if unparseable. */
export function timestampFromId(id) {
  if (typeof id !== 'string') return null;
  const body = id.includes('_') ? id.slice(id.indexOf('_') + 1) : id;
  if (body.length < TIME_LEN) return null;
  let time = 0;
  for (let i = 0; i < TIME_LEN; i++) {
    const idx = ENCODING.indexOf(body[i]);
    if (idx === -1) return null;
    time = time * ENCODING_LEN + idx;
  }
  return time;
}
