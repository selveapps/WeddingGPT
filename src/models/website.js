import { createEntity } from './base';
import { createId } from '../lib/id';

/**
 * The wedding website's content (slice E2). One record per wedding, synced to
 * the server, which renders it at the RSVP page address. Who can see it is not
 * stored here - that is a server setting, so syncing can never publish it.
 *
 * Sections are plain lists of small items so the editor can add, change and
 * remove them one at a time.
 */

export const WebsiteSection = {
  EVENTS: 'events',
  STAYS: 'stays',
  REGISTRY: 'registry',
  FAQ: 'faq',
};

export const WEBSITE_LIMITS = {
  textChars: 4000,
  itemsPerSection: 30,
};

export function createWebsite({ weddingId } = {}) {
  return createEntity('site', {
    weddingId,
    welcome: { title: '', body: '' },
    events: [],
    travel: '',
    stays: [],
    registry: [],
    faq: [],
  });
}

const EMPTY_ITEMS = {
  [WebsiteSection.EVENTS]: { name: '', date: null, time: '', place: '', address: '', notes: '' },
  [WebsiteSection.STAYS]: { name: '', url: '', notes: '' },
  [WebsiteSection.REGISTRY]: { name: '', url: '' },
  [WebsiteSection.FAQ]: { question: '', answer: '' },
};

export function createWebsiteItem(section, fields = {}) {
  return { id: createId('item'), ...EMPTY_ITEMS[section], ...fields };
}

/** The server renders only http(s) links; say so here rather than drop them silently. */
export function websiteUrlError(value, { required = false } = {}) {
  const text = String(value ?? '').trim();
  if (!text) return required ? 'Add the link.' : null;
  if (!/^https?:\/\//i.test(text)) return 'Links start with https://';
  try {
    new URL(text);
    return null;
  } catch {
    return 'That link does not look right.';
  }
}

/** Errors for one item, as `{ field: message }`. */
export function validateWebsiteItem(section, item) {
  const errors = {};
  if (section === WebsiteSection.EVENTS && !item.name?.trim() && !item.place?.trim()) {
    errors.name = 'Give it a name or a place.';
  }
  if (section === WebsiteSection.STAYS) {
    if (!item.name?.trim()) errors.name = 'Add the name.';
    const url = websiteUrlError(item.url);
    if (url) errors.url = url;
  }
  if (section === WebsiteSection.REGISTRY) {
    if (!item.name?.trim()) errors.name = 'Add the name.';
    const url = websiteUrlError(item.url, { required: true });
    if (url) errors.url = url;
  }
  if (section === WebsiteSection.FAQ) {
    if (!item.question?.trim()) errors.question = 'Add the question.';
    if (!item.answer?.trim()) errors.answer = 'Add the answer.';
  }
  for (const [field, value] of Object.entries(item)) {
    if (typeof value === 'string' && value.length > WEBSITE_LIMITS.textChars)
      errors[field] = 'That is too long.';
  }
  return errors;
}

/** The parts of the site that have something in them, for the editor's summary. */
export function websiteFilledSections(website) {
  if (!website) return [];
  return [
    website.welcome?.title || website.welcome?.body ? 'welcome' : null,
    website.events?.length ? 'schedule' : null,
    website.travel || website.stays?.length ? 'travel' : null,
    website.registry?.length ? 'registry' : null,
    website.faq?.length ? 'questions' : null,
  ].filter(Boolean);
}
