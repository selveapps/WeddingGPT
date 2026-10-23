import { formatLongDate } from '@/lib/date';
import { formatMoney } from '@/lib/currency';
import { normalisePrivacySettings } from '../../privacy/lib/privacyHelpers';

function addLine(lines, label, value) {
  if (value !== null && value !== undefined && String(value).trim()) {
    lines.push(`${label}: ${String(value).trim()}`);
  }
}

/**
 * Build a shareable summary using only details enabled in privacy preferences.
 * A person must still choose a destination in the operating-system share sheet.
 */
export function buildShareableProfile(values = {}, privacy = {}) {
  const settings = normalisePrivacySettings(privacy);
  const lines = ['Our wedding'];

  addLine(lines, 'Couple', [values.ownerName, values.partnerName].filter(Boolean).join(' & '));

  if (values.date) {
    const date = formatLongDate(values.date);
    addLine(lines, 'Date', date && date !== 'Invalid Date' ? date : values.date);
  }

  if (settings.showWeddingLocation) {
    addLine(lines, 'Location', [values.city, values.region, values.country].filter(Boolean).join(', '));
  }

  if (settings.showGuestEstimate && Number(values.guestCountEstimate) > 0) {
    addLine(lines, 'Guest estimate', values.guestCountEstimate);
  }

  if (Number(values.budgetTotal) > 0) {
    addLine(lines, 'Budget', formatMoney(Number(values.budgetTotal), values.currency));
  }

  if (settings.showContactDetails) {
    addLine(lines, 'Email', values.email);
    addLine(lines, 'Phone', values.phone);
  }

  return lines.join('\n');
}

export function shareSummaryFilename(date = new Date()) {
  const datePart = date.toISOString().slice(0, 10);
  return `wedding-profile-${datePart}.txt`;
}
