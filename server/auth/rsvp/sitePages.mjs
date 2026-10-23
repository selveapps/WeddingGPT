import { html, page } from './html.mjs';
import { coupleTitle } from './pages.mjs';
import { mapUrl } from './site.mjs';

/**
 * The wedding website page (slice E2). Content arrives already sanitised by
 * `sanitiseContent`; every value is still escaped by `html`, and every link
 * has been checked to be http(s). Guest names never appear here.
 */

const longDate = (iso) =>
  iso && !Number.isNaN(Date.parse(iso))
    ? new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : null;

/** Blank-line separated text as paragraphs; single newlines become line breaks. */
function paragraphs(value) {
  return value
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => html`<p>${block.split('\n').map((line, i) => (i ? html`<br>${line}` : line))}</p>`);
}

const external = (url, label) => html`<a href="${url}" rel="noopener noreferrer nofollow" target="_blank">${label}</a>`;

export function sitePage({ wedding, content, rsvpUrl, indexable }) {
  const date = wedding?.dateType === 'exact' ? longDate(wedding?.date) : null;
  const place = [wedding?.venueName, wedding?.city].map((part) => part?.trim()).filter(Boolean).join(', ');
  const title = coupleTitle(wedding);

  const body = html`
    <h1>${content.welcomeTitle || title}</h1>
    ${content.welcomeTitle ? html`<p class="muted">${title}</p>` : ''}
    ${date || place ? html`<p class="muted">${[date, place].filter(Boolean).join(' · ')}</p>` : ''}
    ${content.welcomeBody ? paragraphs(content.welcomeBody) : ''}
    ${rsvpUrl ? html`<a class="button" href="${rsvpUrl}">RSVP</a>` : ''}

    ${content.events.length
      ? html`<h2>Schedule</h2>
          <div class="card">
            ${content.events.map((event) => {
              const map = mapUrl(event.address || event.place);
              return html`<div class="event">
                <strong>${event.name || event.place}</strong>
                <div class="muted">${[longDate(event.date), event.time].filter(Boolean).join(', ')}</div>
                ${event.place ? html`<div>${event.place}</div>` : ''}
                ${event.address ? html`<div class="muted">${event.address}</div>` : ''}
                ${map ? html`<div>${external(map, 'Directions')}</div>` : ''}
                ${event.notes ? paragraphs(event.notes) : ''}
              </div>`;
            })}
          </div>`
      : ''}

    ${content.travel || content.stays.length
      ? html`<h2>Travel and stay</h2>
          ${content.travel ? paragraphs(content.travel) : ''}
          ${content.stays.length
            ? html`<div class="card">
                ${content.stays.map(
                  (stay) => html`<div class="event">
                    <strong>${stay.url ? external(stay.url, stay.name) : stay.name}</strong>
                    ${stay.notes ? paragraphs(stay.notes) : ''}
                  </div>`
                )}
              </div>`
            : ''}`
      : ''}

    ${content.registry.length
      ? html`<h2>Registry</h2>
          <div class="card">${content.registry.map((item) => html`<div class="event">${external(item.url, item.name)}</div>`)}</div>`
      : ''}

    ${content.faq.length
      ? html`<h2>Questions</h2>
          <dl>${content.faq.map((item) => html`<dt>${item.question}</dt><dd>${paragraphs(item.answer)}</dd>`)}</dl>`
      : ''}
  `;

  return page({ title, body, indexable });
}

export function sitePasswordPage({ wedding, action, error = null }) {
  return page({
    title: coupleTitle(wedding),
    body: html`<h1>${coupleTitle(wedding)}</h1>
      <form method="post" action="${action}" class="card">
        <label for="password">This page is private. Enter the password from your invitation.</label>
        <input type="text" id="password" name="password" autocomplete="off" maxlength="64">
        ${error ? html`<p class="error" role="alert">${error}</p>` : ''}
        <p><button type="submit">Open the page</button></p>
      </form>`,
  });
}
