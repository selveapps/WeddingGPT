import { GuestScope, eventGuestSummary, eventName, eventWhen } from './events';
import { buildCateringReport } from './catering';
import { itemEnd, itemsForDay, sortRunOfShow } from './runOfShow';
import { guestLabel, seatingSummary, tablesForEvent } from './seating';
import { VENDOR_CATEGORIES, isVendorBooked } from './vendors';
import { roleLabel } from './weddingParty';
import { formatTime } from '../lib/time';
import { formatLongDate } from '../lib/date';

/**
 * The printable plan for one event (slice G3): when and where, the run of
 * show, who sits where, the caterer's numbers, and who to call. One page to
 * hand the planner, the venue manager or a parent, or to keep in a pocket on
 * the day.
 *
 * `buildEventPlan` gathers it from the workspace; `eventPlanText` and
 * `eventPlanHtml` lay it out for sharing and printing. `event` null is the
 * wedding day itself, as in the run of show and seating.
 */

/** Tables beyond this are left off the page with a count; a 40-table chart is its own document. */
export const PLAN_MAX_TABLES = 30;

const categoryName = (key) => VENDOR_CATEGORIES.find((category) => category.key === key)?.name ?? 'Vendor';

export function buildEventPlan({
  event = null,
  wedding = null,
  guests = [],
  tables = [],
  runOfShow = [],
  vendors = [],
  party = [],
} = {}) {
  const eventId = event?.id ?? null;
  const name = event ? eventName(event) : 'Wedding day';
  const date = event ? event.date : (wedding?.date ?? null);

  // Without an event the wedding day counts everyone's reply for the wedding.
  const counts = eventGuestSummary(event ?? { guestScope: GuestScope.EVERYONE }, guests);
  const catering = buildCateringReport(guests, { event });

  const schedule = sortRunOfShow(itemsForDay(runOfShow, eventId)).map((item) => ({
    time: `${formatTime(item.start)} - ${formatTime(itemEnd(item))}`,
    title: item.title,
    details: [item.location, item.owner].filter(Boolean).join(', '),
  }));

  const byId = new Map(guests.map((guest) => [guest.id, guest]));
  const roomTables = tablesForEvent(tables, eventId);
  const seating = roomTables.slice(0, PLAN_MAX_TABLES).map((table) => ({
    name: table.name,
    capacity: table.capacity,
    guests: table.guestIds
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map(guestLabel),
  }));
  const seated = roomTables.length ? seatingSummary(roomTables, guests, event) : null;

  const contacts = [
    ...party
      .filter((member) => member.phone || member.email)
      .map((member) => ({
        name: member.name,
        role: roleLabel(member.roleKey),
        phone: member.phone,
        email: member.email,
      })),
    ...vendors
      .filter((vendor) => isVendorBooked(vendor) && (vendor.phone || vendor.email))
      .map((vendor) => ({
        name: vendor.contactName ? `${vendor.name} (${vendor.contactName})` : vendor.name,
        role: categoryName(vendor.categoryKey),
        phone: vendor.phone ?? '',
        email: vendor.email ?? '',
      })),
  ];

  return {
    name,
    date: date ? formatLongDate(date) : '',
    when: event ? eventWhen(event) : '',
    venue: event?.venueName?.trim() ?? '',
    address: event?.address?.trim() ?? '',
    dressCode: event?.dressCode?.trim() ?? '',
    notes: event?.notes?.trim() ?? '',
    guests: counts,
    catering: {
      headcount: catering.headcount,
      children: catering.children,
      meals: catering.meals,
      allergens: catering.allergens.map((allergen) => ({ label: allergen.label, guests: allergen.guests })),
    },
    schedule,
    seating,
    tablesLeftOff: Math.max(0, roomTables.length - PLAN_MAX_TABLES),
    unseated: seated?.unseated ?? 0,
    contacts,
  };
}

const plural = (count, one, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

function headline(plan) {
  return [plan.date, plan.when].filter(Boolean).join(', ');
}

function place(plan) {
  return [plan.venue, plan.address].filter(Boolean).join(', ');
}

function guestLine(plan) {
  const { invited, attending, awaiting } = plan.guests;
  if (!invited) return 'No guests yet';
  return `${plural(attending, 'guest')} attending of ${invited} invited${awaiting ? `, ${awaiting} still to answer` : ''}`;
}

function contactLine(contact) {
  return [contact.phone, contact.email].filter(Boolean).join(' · ');
}

/** The plan as plain text, for the share sheet and messages. */
export function eventPlanText(plan) {
  const lines = [plan.name];
  if (headline(plan)) lines.push(headline(plan));
  if (place(plan)) lines.push(place(plan));
  if (plan.dressCode) lines.push(`Dress code: ${plan.dressCode}`);
  lines.push(guestLine(plan), `Plates: ${plan.catering.headcount}`);

  if (plan.schedule.length) {
    lines.push('', 'Schedule');
    for (const item of plan.schedule) {
      lines.push(`${item.time}  ${item.title}${item.details ? ` (${item.details})` : ''}`);
    }
  }

  if (plan.catering.allergens.length) {
    lines.push('', 'Allergies to check');
    for (const allergen of plan.catering.allergens)
      lines.push(`${allergen.label}: ${allergen.guests.join(', ')}`);
  }

  if (plan.seating.length) {
    lines.push('', 'Seating');
    for (const table of plan.seating) lines.push(`${table.name}: ${table.guests.join(', ') || 'empty'}`);
    if (plan.tablesLeftOff) lines.push(`and ${plural(plan.tablesLeftOff, 'more table')}`);
    if (plan.unseated) lines.push(`${plural(plan.unseated, 'guest')} without a seat yet`);
  }

  if (plan.contacts.length) {
    lines.push('', 'Contacts');
    for (const contact of plan.contacts)
      lines.push(`${contact.name} - ${contact.role}: ${contactLine(contact)}`);
  }

  if (plan.notes) lines.push('', 'Notes', plan.notes);
  return lines.join('\n');
}

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
/** Everything in the plan is typed by the couple, so all of it is escaped. */
export const escapeHtml = (text) => String(text ?? '').replace(/[&<>"']/g, (char) => ESCAPES[char]);

const section = (title, body) => `<section><h2>${escapeHtml(title)}</h2>${body}</section>`;

/** The plan as a standalone page, laid out for A4 or Letter. */
export function eventPlanHtml(plan, { title = '' } = {}) {
  const e = escapeHtml;
  const facts = [headline(plan), place(plan), plan.dressCode && `Dress code: ${plan.dressCode}`]
    .filter(Boolean)
    .map((fact) => `<p>${e(fact)}</p>`)
    .join('');

  const parts = [
    `<header><p class="eyebrow">${e(title)}</p><h1>${e(plan.name)}</h1>${facts}<p class="numbers">${e(guestLine(plan))} · ${e(plural(plan.catering.headcount, 'plate'))}</p></header>`,
  ];

  if (plan.schedule.length) {
    const rows = plan.schedule
      .map(
        (item) =>
          `<tr><td class="time">${e(item.time)}</td><td>${e(item.title)}</td><td>${e(item.details)}</td></tr>`
      )
      .join('');
    parts.push(section('Schedule', `<table>${rows}</table>`));
  }

  if (plan.catering.headcount) {
    const meals = plan.catering.meals.map((meal) => `<li>${e(meal.label)}: ${meal.count}</li>`).join('');
    const allergens = plan.catering.allergens
      .map((allergen) => `<li><strong>${e(allergen.label)}</strong>: ${e(allergen.guests.join(', '))}</li>`)
      .join('');
    parts.push(
      section(
        'Catering',
        `<ul>${meals}</ul>${allergens ? `<p class="label">Allergies to check with the guest</p><ul>${allergens}</ul>` : ''}`
      )
    );
  }

  if (plan.seating.length) {
    const tables = plan.seating
      .map(
        (table) =>
          `<div class="table"><h3>${e(table.name)} <span>${table.guests.length}/${table.capacity}</span></h3><p>${e(table.guests.join(', ') || 'Empty')}</p></div>`
      )
      .join('');
    const extra = [
      plan.tablesLeftOff && `and ${plural(plan.tablesLeftOff, 'more table')}`,
      plan.unseated && `${plural(plan.unseated, 'guest')} without a seat yet`,
    ]
      .filter(Boolean)
      .map((line) => `<p class="label">${e(line)}</p>`)
      .join('');
    parts.push(section('Seating', `<div class="tables">${tables}</div>${extra}`));
  }

  if (plan.contacts.length) {
    const rows = plan.contacts
      .map(
        (contact) =>
          `<tr><td>${e(contact.name)}</td><td>${e(contact.role)}</td><td>${e(contactLine(contact))}</td></tr>`
      )
      .join('');
    parts.push(section('Contacts', `<table>${rows}</table>`));
  }

  if (plan.notes) parts.push(section('Notes', `<p class="notes">${e(plan.notes)}</p>`));

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(plan.name)}</title>
<style>
  @page { margin: 16mm; }
  body { font: 11pt/1.45 Georgia, 'Times New Roman', serif; color: #2b2522; margin: 0 auto; max-width: 720px; padding: 16px; }
  h1 { font-size: 22pt; margin: 0 0 4px; font-weight: normal; }
  h2 { font-size: 13pt; margin: 20px 0 6px; border-bottom: 1px solid #d8cfc8; padding-bottom: 2px; }
  h3 { font-size: 10.5pt; margin: 0 0 2px; }
  h3 span { color: #7a6f69; font-weight: normal; }
  header p { margin: 2px 0; }
  .eyebrow, .label { color: #7a6f69; font-size: 9.5pt; margin: 6px 0 2px; }
  .numbers { margin-top: 8px; font-weight: bold; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 3px 8px 3px 0; vertical-align: top; border-bottom: 1px solid #eee6e0; }
  td.time { white-space: nowrap; width: 1%; }
  ul { margin: 0; padding-left: 18px; }
  .tables { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 16px; }
  .table { break-inside: avoid; }
  .table p { margin: 0; font-size: 10pt; }
  .notes { white-space: pre-wrap; }
  h2 { break-after: avoid; }
</style></head>
<body>${parts.join('\n')}</body></html>`;
}
