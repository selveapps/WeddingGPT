import { cleanText, makeId, toPositiveNumber } from './storage';

export const DEFAULT_TIMELINE = [
  { id: 'timeline-ceremony', title: 'Ceremony', time: '15:00', duration: 45, location: 'Ceremony venue', notes: '', done: false },
  { id: 'timeline-photos', title: 'Couple and family photos', time: '15:50', duration: 40, location: 'Photo area', notes: 'Keep family list with the photographer.', done: false },
  { id: 'timeline-cocktail', title: 'Cocktail hour', time: '16:30', duration: 60, location: 'Reception venue', notes: '', done: false },
  { id: 'timeline-dinner', title: 'Dinner', time: '17:30', duration: 75, location: 'Reception venue', notes: 'Confirm dietary labels.', done: false },
  { id: 'timeline-dance', title: 'First dance and party', time: '19:00', duration: 120, location: 'Dance floor', notes: '', done: false },
];

export function parseClock(value) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(value ?? '').trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function formatClock(minutes) {
  const safe = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

export function normalizeTimelineItem(item = {}) {
  const title = cleanText(item.title, 100);
  const time = parseClock(item.time) == null ? '09:00' : item.time;
  return {
    id: cleanText(item.id, 100) || makeId('timeline'),
    title: title || 'Untitled event',
    time,
    duration: Math.max(5, Math.min(720, Math.round(toPositiveNumber(item.duration, 30)))),
    location: cleanText(item.location, 140),
    notes: cleanText(item.notes, 500),
    done: Boolean(item.done),
  };
}

export function sortTimeline(items = []) {
  return items.map(normalizeTimelineItem).sort((a, b) => parseClock(a.time) - parseClock(b.time));
}

export function timelineEnd(item) {
  const start = parseClock(item.time);
  return start == null ? null : start + item.duration;
}

export function findTimelineConflicts(items = []) {
  const sorted = sortTimeline(items);
  const conflicts = [];
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const current = sorted[i];
    const next = sorted[i + 1];
    const end = timelineEnd(current);
    const nextStart = parseClock(next.time);
    if (end != null && nextStart < end) {
      conflicts.push({
        firstId: current.id,
        secondId: next.id,
        firstTitle: current.title,
        secondTitle: next.title,
        overlapMinutes: end - nextStart,
      });
    }
  }
  return conflicts;
}

export function addTimelineItem(items, draft) {
  return sortTimeline([...items, normalizeTimelineItem({ ...draft, id: makeId('timeline') })]);
}

export function updateTimelineItem(items, id, patch) {
  return sortTimeline(items.map((item) => item.id === id ? normalizeTimelineItem({ ...item, ...patch, id }) : item));
}

export function deleteTimelineItem(items, id) {
  return items.filter((item) => item.id !== id);
}

export function moveTimelineItem(items, id, direction) {
  const sorted = sortTimeline(items);
  const index = sorted.findIndex((item) => item.id === id);
  if (index < 0) return sorted;
  const target = Math.max(0, Math.min(sorted.length - 1, index + direction));
  if (target === index) return sorted;
  const copy = [...sorted];
  [copy[index], copy[target]] = [copy[target], copy[index]];
  // Keep the chosen ordering by nudging times to maintain a readable sequence.
  return copy.map((item, itemIndex) => ({
    ...item,
    time: formatClock((parseClock(item.time) ?? 540) + itemIndex),
  }));
}

export function buildTimelineText(items, weddingTitle = 'Wedding day') {
  const lines = [`${cleanText(weddingTitle, 100) || 'Wedding day'} — Run of show`, ''];
  sortTimeline(items).forEach((item) => {
    lines.push(`${item.time}  ${item.title} (${item.duration} min)`);
    if (item.location) lines.push(`   Location: ${item.location}`);
    if (item.notes) lines.push(`   Notes: ${item.notes}`);
    lines.push('');
  });
  const conflicts = findTimelineConflicts(items);
  if (conflicts.length) {
    lines.push('CHECK TIMING OVERLAPS');
    conflicts.forEach((conflict) => {
      lines.push(`- ${conflict.firstTitle} overlaps ${conflict.secondTitle} by ${conflict.overlapMinutes} min`);
    });
  }
  return lines.join('\n').trim();
}
