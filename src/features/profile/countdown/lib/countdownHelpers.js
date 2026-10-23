import { daysUntil, formatLongDate } from '@/lib/date';

export function getWeddingCountdown(date, now = new Date()) {
  const days = daysUntil(date, now);
  if (days === null) {
    return { valid: false, days: null, label: 'Add a wedding date to start the countdown.' };
  }
  if (days < 0) {
    const elapsed = Math.abs(days);
    return { valid: true, days, label: `${elapsed} ${elapsed === 1 ? 'day' : 'days'} since your wedding` };
  }
  if (days === 0) return { valid: true, days, label: 'Your wedding is today!' };
  return { valid: true, days, label: `${days} ${days === 1 ? 'day' : 'days'} to go` };
}

export function getCountdownBreakdown(date, now = new Date()) {
  const countdown = getWeddingCountdown(date, now);
  if (!countdown.valid || countdown.days < 0) return null;
  const months = Math.floor(countdown.days / 30.44);
  const daysAfterMonths = countdown.days - Math.floor(months * 30.44);
  const weeks = Math.floor(daysAfterMonths / 7);
  const days = daysAfterMonths - weeks * 7;
  return { months, weeks, days, totalDays: countdown.days };
}

export function getWeddingDateLabel(date) {
  return formatLongDate(date) || 'Date not set';
}
