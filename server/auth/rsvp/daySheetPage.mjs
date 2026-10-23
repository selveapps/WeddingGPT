import { html, page } from './html.mjs';
import { coupleTitle, eventLine } from './pages.mjs';

/**
 * The day-of sheet a vendor opens (slice F3). Plain HTML, no script, every
 * value through the escaping template (D3), and only what `content()` chose
 * to show (D2).
 */

const minutesToClock = (minutes) => {
  const total = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const hours = Math.floor(total / 60);
  return `${hours % 12 || 12}:${String(total % 60).padStart(2, '0')} ${hours < 12 ? 'AM' : 'PM'}`;
};

/** "maid_of_honor" -> "Maid of honor": role keys are the app's, labels need not be repeated here. */
const roleName = (key) => {
  const words = String(key ?? '').replace(/_/g, ' ').trim();
  return words && words !== 'other' ? words.charAt(0).toUpperCase() + words.slice(1) : '';
};

/** `tel:` keeps only what a phone number can contain, so it can never become another kind of link. */
const telHref = (phone) => `tel:${String(phone).replace(/[^0-9+]/g, '')}`;

const details = (item) => [item.location, item.owner].filter(Boolean).join(', ');

function scheduleLine(item) {
  const end = item.durationMin ? html` - ${minutesToClock(item.start + item.durationMin)}` : '';
  const extra = details(item) ? html` <span class="muted">(${details(item)})</span>` : '';
  return html`<li><strong>${minutesToClock(item.start)}</strong>${end} ${item.title}${extra}</li>`;
}

function contactLine(contact) {
  const role = roleName(contact.roleKey) ? html` <span class="muted">(${roleName(contact.roleKey)})</span>` : '';
  const phone = contact.phone ? html` - <a href="${telHref(contact.phone)}">${contact.phone}</a>` : '';
  return html`<li>${contact.name}${role}${phone}</li>`;
}

export function daySheetPage({ content }) {
  const { label, couple, when, items, contacts } = content;
  const line = eventLine(when);
  const schedule = items.length
    ? html`<ul class="schedule">${items.map(scheduleLine)}</ul>`
    : html`<p class="muted">The timings are still being planned.</p>`;
  const people = contacts.length
    ? html`<div class="card"><h2>On the day, call</h2><ul>${contacts.map(contactLine)}</ul></div>`
    : '';
  return page({
    title: `${when.name} - ${coupleTitle(couple)}`,
    body: html`<h1>${coupleTitle(couple)}</h1>
      <p class="muted">Day-of sheet for ${label}</p>
      <div class="card">
        <h2>${when.name}</h2>
        ${line ? html`<p>${line}</p>` : ''}
        ${when.address ? html`<p>${when.address}</p>` : ''}
        ${when.dressCode ? html`<p class="muted">Dress code: ${when.dressCode}</p>` : ''}
      </div>
      <div class="card"><h2>Run of show</h2>${schedule}</div>
      ${people}
      <p class="muted">This page updates as the plan changes. Please do not share the link.</p>`,
  });
}
