export function timeToMinutes(value) {
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value.trim())) return null;
  const [hours, minutes] = value.trim().split(':').map(Number);
  return hours * 60 + minutes;
}

export function formatTimelineTime(value) {
  const minutes = timeToMinutes(value);
  if (minutes === null) return value || '';

  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const suffix = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`;
}

export function sortTimelineEvents(events = []) {
  return [...events].sort((a, b) => {
    const aTime = timeToMinutes(a?.time);
    const bTime = timeToMinutes(b?.time);
    if (aTime === null && bTime === null) return (a?.title ?? '').localeCompare(b?.title ?? '');
    if (aTime === null) return 1;
    if (bTime === null) return -1;
    return aTime - bTime || (a?.title ?? '').localeCompare(b?.title ?? '');
  });
}

export function validateTimelineEvent(values = {}) {
  const errors = {};
  if (!values.title?.trim()) errors.title = 'Give this moment a name.';
  if (timeToMinutes(values.time) === null) errors.time = 'Enter a time from 00:00 to 23:59.';
  if (values.title?.trim().length > 70) errors.title = 'Keep the moment name under 70 characters.';
  if (values.owner?.trim().length > 70) errors.owner = 'Keep the responsibility note under 70 characters.';
  if (values.note?.trim().length > 220) errors.note = 'Keep extra details under 220 characters.';
  return { isValid: Object.keys(errors).length === 0, errors };
}

export function summariseTimeline(events = []) {
  const completed = events.filter((event) => event.completed).length;
  return {
    total: events.length,
    completed,
    remaining: events.length - completed,
  };
}
