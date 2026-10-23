import { daysUntil, formatLongDate, toISODate } from '@/lib/date';
import { isCalendarDate } from '../../keepsakes/lib/keepsakeHelpers';

function annualISODate(year, month, day) {
  const date = new Date(year, month - 1, day);
  if (date.getMonth() !== month - 1) {
    return toISODate(new Date(year, month, 0));
  }
  return toISODate(date);
}

function nextAnnualDate(isoDate, now) {
  if (!isCalendarDate(isoDate)) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate ?? '');
  if (!match) return null;
  const [, startYearText, monthText, dayText] = match;
  const startYear = Number(startYearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const thisYear = now.getFullYear();
  if (thisYear < startYear) return null;

  const today = toISODate(now);
  let targetYear = thisYear;
  if (targetYear === startYear || annualISODate(targetYear, month, day) < today) {
    targetYear += 1;
  }
  const date = annualISODate(targetYear, month, day);
  return {
    date,
    years: targetYear - startYear,
    daysUntil: daysUntil(date, now),
  };
}

export function getNextAnniversary(milestones = [], now = new Date()) {
  const candidates = milestones
    .filter((milestone) => milestone?.type === 'relationship' && milestone.date)
    .map((milestone) => {
      const anniversary = nextAnnualDate(milestone.date, now);
      if (!anniversary) return null;
      return {
        ...anniversary,
        title: milestone.title || 'A special day',
        dateLabel: formatLongDate(anniversary.date),
        sourceDate: milestone.date,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  return candidates[0] ?? null;
}

export function getCurrentLocalDate(now = new Date()) {
  return toISODate(now);
}
