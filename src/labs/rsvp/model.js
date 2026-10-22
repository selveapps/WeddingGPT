import { RsvpStatus, guestFullName, groupByHousehold } from '@/models';

/**
 * RSVP codes (Labs).
 *
 * Every household - or guest without one - gets a six-character code derived
 * from its ID, so the same invitee always has the same code and nothing extra
 * needs storing. Guests reply with the code ("K7Q2MX yes 2") by text, email or,
 * once one exists, a web form at `EXPO_PUBLIC_RSVP_URL?code=...`. Replies are
 * parsed into a preview and only applied when the couple confirms.
 */

/** No 0/O, 1/I/L - codes get read aloud and typed on phones. */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 6;

/** FNV-1a, written out in base 31. Deterministic and well spread for short IDs. */
export function rsvpCode(id) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < String(id).length; i++) {
    hash ^= String(id).charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  // 31^6 is just under 2^32, so six base-31 digits use the whole hash.
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[hash % ALPHABET.length];
    hash = Math.floor(hash / ALPHABET.length);
  }
  return code;
}

/** One invitee per household with members, plus each loose guest. */
export function buildInvitees(guests = [], households = []) {
  const { grouped, ungrouped } = groupByHousehold(guests, households);
  const invitees = grouped
    .filter((entry) => entry.guests.length)
    .map(({ household, guests: members }) => ({
      key: household.id,
      code: rsvpCode(household.id),
      name: household.name || members.map(guestFullName).join(' & '),
      guestIds: members.map((guest) => guest.id),
    }));

  for (const guest of ungrouped) {
    invitees.push({
      key: guest.id,
      code: rsvpCode(guest.id),
      name: guestFullName(guest) || 'Guest',
      guestIds: [guest.id],
    });
  }

  return invitees.sort((a, b) => a.name.localeCompare(b.name));
}

export function rsvpLink(baseUrl, code) {
  const base = baseUrl?.trim();
  if (!base) return null;
  return `${base}${base.includes('?') ? '&' : '?'}code=${code}`;
}

export function inviteMessage({ invitee, coupleName, dateText, link }) {
  const lines = [
    `Hi ${invitee.name}!`,
    '',
    `${coupleName} would love you to join them${dateText ? ` on ${dateText}` : ''}.`,
    '',
  ];
  if (link) lines.push(`RSVP here: ${link}`);
  else lines.push(`To RSVP, just reply with your code and yes or no - for example "${invitee.code} yes 2".`);
  lines.push(`Your code: ${invitee.code}`);
  return lines.join('\n');
}

const YES = /^(yes|y|attending|accept|accepts|coming|going)$/i;
const NO = /^(no|n|declined?|declines|regrets|cant|can't|not)$/i;
const MAYBE = /^(maybe|perhaps|unsure|tbc)$/i;

function parseStatus(word) {
  if (YES.test(word)) return RsvpStatus.ATTENDING;
  if (NO.test(word)) return RsvpStatus.DECLINED;
  if (MAYBE.test(word)) return RsvpStatus.MAYBE;
  return null;
}

/**
 * Parse pasted replies, one per line: CODE STATUS [COUNT]. Anything around
 * the code ("Hi! K7Q2MX yes 2, can't wait") is tolerated.
 */
export function parseRsvpReplies(text, invitees = []) {
  const byCode = new Map(invitees.map((invitee) => [invitee.code, invitee]));
  const replies = [];
  const errors = [];

  for (const raw of (text ?? '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;

    const words = line.toUpperCase().replace(/[^A-Z0-9' ]/g, ' ').split(/\s+/).filter(Boolean);
    const codeIndex = words.findIndex((word) => word.length === CODE_LENGTH && byCode.has(word));
    if (codeIndex === -1) {
      errors.push({ line, reason: 'No matching code' });
      continue;
    }

    const after = words.slice(codeIndex + 1);
    const statusWord = after.find((word) => parseStatus(word));
    const status = statusWord ? parseStatus(statusWord) : null;
    if (!status) {
      errors.push({ line, reason: 'Could not tell if that is a yes or a no' });
      continue;
    }

    const countWord = after.find((word) => /^\d+$/.test(word));
    replies.push({
      line,
      invitee: byCode.get(words[codeIndex]),
      status,
      count: countWord ? Number(countWord) : null,
    });
  }

  return { replies, errors };
}

/**
 * Per-guest RSVP changes. "yes 2" for a household of four marks the first two
 * attending and the rest declined; a later reply for the same code wins.
 */
export function repliesToChanges(replies = []) {
  const changes = new Map();
  for (const reply of replies) {
    const ids = reply.invitee.guestIds;
    ids.forEach((guestId, index) => {
      const status =
        reply.status === RsvpStatus.ATTENDING && reply.count !== null && index >= reply.count
          ? RsvpStatus.DECLINED
          : reply.status;
      changes.set(guestId, status);
    });
  }
  return [...changes].map(([guestId, rsvpStatus]) => ({ guestId, rsvpStatus }));
}
