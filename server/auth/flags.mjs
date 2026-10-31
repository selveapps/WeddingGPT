/**
 * Remote feature flags (slice K1b): what the server tells every app, so the
 * team can switch a feature off for everyone without a release.
 *
 * Set with `REMOTE_FLAGS="liveMode=off,visionPhotos=on"`. The server does not
 * know the app's flag list (old and new apps ask the same server), so it
 * passes on any well-formed name and each app ignores names it does not
 * know. Only booleans: anything richer belongs in its own endpoint.
 */

export const FLAG_LIMITS = { flags: 50, nameChars: 64 };

const NAME = /^[A-Za-z][A-Za-z0-9_]*$/;
const ON = new Set(['on', 'true', '1', 'yes']);
const OFF = new Set(['off', 'false', '0', 'no']);

/** `{ flags, skipped }` from `name=on,other=off`; skipped lists what was not read. */
export function parseFlagList(text) {
  const flags = {};
  const skipped = [];
  for (const pair of String(text ?? '').split(',')) {
    if (!pair.trim()) continue;
    const [rawName = '', rawValue = '', ...rest] = pair.split('=').map((part) => part.trim());
    const value = rawValue.toLowerCase();
    const readable =
      !rest.length &&
      rawName.length <= FLAG_LIMITS.nameChars &&
      NAME.test(rawName) &&
      (ON.has(value) || OFF.has(value)) &&
      (rawName in flags || Object.keys(flags).length < FLAG_LIMITS.flags);
    if (readable) flags[rawName] = ON.has(value);
    else skipped.push(pair.trim());
  }
  return { flags, skipped };
}
