import { html, page } from './html.mjs';
import { MEAL_CHOICES } from './rsvp.mjs';

/**
 * The guest-facing RSVP pages. Plain HTML forms, no script: they load fast on
 * a weak connection and work in any browser (design E §2). Guests see first
 * names only, and only their own invitation's guests (W2).
 */

const formatDate = (iso) => {
  if (!iso || Number.isNaN(Date.parse(iso))) return null;
  return new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
};

export function coupleTitle(wedding) {
  const names = [wedding?.ownerName, wedding?.partnerName].map((name) => name?.trim()).filter(Boolean);
  return names.length ? names.join(' & ') : 'Our wedding';
}

function weddingHeader(wedding, settings) {
  const date = wedding?.dateType === 'exact' ? formatDate(wedding?.date) : null;
  const place = [wedding?.venueName, wedding?.city].map((part) => part?.trim()).filter(Boolean).join(', ');
  const deadline = formatDate(settings?.deadline);
  return html`
    <h1>${coupleTitle(wedding)}</h1>
    ${date ? html`<p class="muted">${date}${place ? html` · ${place}` : ''}</p>` : place ? html`<p class="muted">${place}</p>` : ''}
    ${deadline ? html`<p>Please reply by <strong>${deadline}</strong>.</p>` : ''}`;
}

function guestFields(guest, questions, previous, error) {
  const was = previous?.guests?.find((answer) => answer.guestId === guest.id) ?? null;
  const yes = was?.attending === true;
  const no = was?.attending === false;
  const mealOptions = MEAL_CHOICES.map(
    (choice) => html`<option value="${choice.value}"${was?.meal === choice.value ? html` selected` : ''}>${choice.label}</option>`
  );
  return html`
    <fieldset>
      <legend>${guest.firstName}</legend>
      ${error ? html`<p class="error" role="alert">${error}</p>` : ''}
      <span class="choice"><input type="radio" id="yes_${guest.id}" name="attending_${guest.id}" value="yes"${yes ? html` checked` : ''}><label for="yes_${guest.id}">Joyfully accepts</label></span>
      <span class="choice"><input type="radio" id="no_${guest.id}" name="attending_${guest.id}" value="no"${no ? html` checked` : ''}><label for="no_${guest.id}">Regretfully declines</label></span>
      ${questions.meals
        ? html`<label for="meal_${guest.id}">Meal</label>
            <select id="meal_${guest.id}" name="meal_${guest.id}"><option value="">No preference</option>${mealOptions}</select>`
        : ''}
      ${questions.dietary
        ? html`<label for="dietary_${guest.id}">Allergies or dietary needs</label>
            <input type="text" id="dietary_${guest.id}" name="dietary_${guest.id}" maxlength="300" value="${was?.dietary ?? ''}">`
        : ''}
      ${questions.plusOnes && guest.plusOneAllowed
        ? html`<label for="plusone_${guest.id}">Bringing a guest? Their name</label>
            <input type="text" id="plusone_${guest.id}" name="plusone_${guest.id}" maxlength="80" value="${was?.plusOneName ?? ''}">`
        : ''}
    </fieldset>`;
}

/** The RSVP form. `hidden` carries the short code when the guest came in by code. */
export function formPage({ context, action, hidden = {}, errors = {}, closed = false }) {
  const { wedding, settings, guests, previous } = context;
  const { questions } = settings;
  const title = `RSVP - ${coupleTitle(wedding)}`;

  if (closed) {
    return page({
      title,
      body: html`${weddingHeader(wedding, settings)}
        <div class="card"><p>Replies have closed. If something has changed, please contact the couple directly.</p></div>`,
    });
  }

  return page({
    title,
    body: html`${weddingHeader(wedding, settings)}
      ${previous ? html`<p class="ok">We have your reply. You can change it below until the deadline.</p>` : ''}
      ${errors.form ? html`<p class="error" role="alert">${errors.form}</p>` : ''}
      <form method="post" action="${action}" class="card">
        ${Object.entries(hidden).map(([name, value]) => html`<input type="hidden" name="${name}" value="${value}">`)}
        <input type="hidden" name="submit" value="1">
        ${guests.map((guest) => guestFields(guest, questions, previous, errors[guest.id]))}
        ${questions.message
          ? html`<label for="message">A note for the couple (optional)</label>
              <textarea id="message" name="message" maxlength="1000">${previous?.message ?? ''}</textarea>
              ${errors.message ? html`<p class="error" role="alert">${errors.message}</p>` : ''}`
          : ''}
        <p><button type="submit">Send our reply</button></p>
      </form>`,
  });
}

export function confirmationPage({ context, response }) {
  const { wedding, settings, guests } = context;
  const name = (id) => guests.find((guest) => guest.id === id)?.firstName ?? 'Guest';
  const coming = response.guests.filter((answer) => answer.attending);
  return page({
    title: `Thank you - ${coupleTitle(wedding)}`,
    body: html`${weddingHeader(wedding, settings)}
      <div class="card">
        <p class="ok"><strong>Thank you - your reply is in.</strong></p>
        <ul>
          ${response.guests.map(
            (answer) =>
              html`<li>${name(answer.guestId)}: ${answer.attending ? 'attending' : 'not attending'}${answer.plusOneName ? html`, with ${answer.plusOneName}` : ''}</li>`
          )}
        </ul>
        <p class="muted">${coming.length ? 'We cannot wait to celebrate with you.' : 'You will be missed.'} You can come back to this page to change your reply until the deadline.</p>
      </div>`,
  });
}

/** Typing the code from a paper invitation. */
export function codePage({ wedding, action, error = null }) {
  return page({
    title: `RSVP - ${coupleTitle(wedding)}`,
    body: html`<h1>${coupleTitle(wedding)}</h1>
      <form method="post" action="${action}" class="card">
        <label for="code">Enter the code from your invitation</label>
        <input type="text" id="code" name="code" autocomplete="off" autocapitalize="characters" maxlength="12" placeholder="ABCD-EFGH">
        ${error ? html`<p class="error" role="alert">${error}</p>` : ''}
        <p><button type="submit">Find our invitation</button></p>
      </form>`,
  });
}

export function messagePage({ title, message }) {
  return page({ title, body: html`<h1>${title}</h1><div class="card"><p>${message}</p></div>` });
}
