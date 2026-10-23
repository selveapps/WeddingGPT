import { groupByHousehold, guestFullName, RsvpStatus } from '@/models';
import { toCsv } from '@/lib/csv';

/**
 * Pure helpers for the RSVP screen (slice E1b).
 */

/**
 * Who gets an invitation: each household with guests in it, and each guest
 * who is not in one. Sorted by name.
 */
export function buildInvitees(guests = [], households = []) {
  const { grouped, ungrouped } = groupByHousehold(guests, households);
  const invitees = grouped
    .filter((entry) => entry.guests.length)
    .map(({ household, guests: members }) => ({
      type: 'household',
      id: household.id,
      name: household.name || members.map(guestFullName).join(' & '),
      guestIds: members.map((guest) => guest.id),
    }));
  for (const guest of ungrouped) {
    invitees.push({
      type: 'guest',
      id: guest.id,
      name: guestFullName(guest) || 'Guest',
      guestIds: [guest.id],
    });
  }
  return invitees.sort((a, b) => a.name.localeCompare(b.name));
}

/** "Priya & Sam" -> "priya-and-sam". Letters, digits and hyphens, 3-40 long. */
export function suggestSlug(wedding) {
  const names = [wedding?.ownerName, wedding?.partnerName].map((name) => name?.trim()).filter(Boolean);
  const slug = names
    .join(' and ')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '');
  return slug.length >= 3 ? slug : 'our-wedding';
}

export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;

/**
 * Where an invitee stands: no link yet, link made (on this phone or another),
 * opened, or replied. `invites` come from the server, `links` from this
 * phone, `responses` from sync.
 */
export function inviteeStatus(invitee, { invites = [], links = {}, responses = [] }) {
  const invite = invites.find(
    (item) => item.targetType === invitee.type && item.targetId === invitee.id && !item.revoked
  );
  const replied = responses.some(
    (response) => response.targetType === invitee.type && response.targetId === invitee.id
  );
  const link = invite ? (links[invite.id] ?? null) : null;
  if (replied) return { status: 'replied', invite, link };
  if (!invite) return { status: 'none', invite: null, link: null };
  return { status: invite.openedAt ? 'opened' : 'sent', invite, link };
}

/** The base of the public site, read from any link this phone made. */
export function publicBase(links = {}) {
  const url = Object.values(links)[0]?.url;
  return url ? url.replace(/\/r\/[^/]+$/, '') : null;
}

/** A spreadsheet of names, codes and links, for printing invitations. */
export function codesCsv(invitees, statusFor, { base = null, slug = null } = {}) {
  const page = base && slug ? `${base}/w/${slug}/rsvp` : '';
  const rows = invitees
    .map((invitee) => ({ invitee, link: statusFor(invitee).link }))
    .filter(({ link }) => link)
    .map(({ invitee, link }) => [invitee.name, link.code, link.url, page]);
  return toCsv([['Name', 'Code', 'Link', 'Or type the code at'], ...rows]);
}

/** "2 coming, 1 not" for one reply. */
export function replySummary(response) {
  const coming = (response.guests ?? []).filter((answer) => answer.attending).length;
  const notComing = (response.guests ?? []).length - coming;
  if (!notComing) return `${coming} coming`;
  if (!coming) return `${notComing} not coming`;
  return `${coming} coming, ${notComing} not`;
}

/** Headline numbers across invitees. */
export function summariseInvitees(invitees, statusFor) {
  const counts = { total: invitees.length, none: 0, sent: 0, opened: 0, replied: 0 };
  for (const invitee of invitees) counts[statusFor(invitee).status] += 1;
  return counts;
}

export { RsvpStatus };
