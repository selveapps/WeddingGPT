import { DEFAULT_PROFILE_PREFERENCES, PACE_OPTIONS, SUPPORT_OPTIONS, WEEK_DAYS } from './preferenceConstants';

export function normaliseProfilePreferences(value) {
  const input = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const pace = PACE_OPTIONS.some(({ value: key }) => key === input.planningPace)
    ? input.planningPace
    : DEFAULT_PROFILE_PREFERENCES.planningPace;
  const support = SUPPORT_OPTIONS.some(({ value: key }) => key === input.supportStyle)
    ? input.supportStyle
    : DEFAULT_PROFILE_PREFERENCES.supportStyle;
  const day = WEEK_DAYS.includes(input.weeklyPlanningDay)
    ? input.weeklyPlanningDay
    : DEFAULT_PROFILE_PREFERENCES.weeklyPlanningDay;
  const quietHoursStart =
    typeof input.quietHoursStart === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(input.quietHoursStart)
      ? input.quietHoursStart
      : DEFAULT_PROFILE_PREFERENCES.quietHoursStart;
  return { planningPace: pace, supportStyle: support, weeklyPlanningDay: day, quietHoursStart };
}

export function describePreferenceSummary(value) {
  const preferences = normaliseProfilePreferences(value);
  const pace = PACE_OPTIONS.find((option) => option.value === preferences.planningPace);
  return `${pace.label} pace · ${preferences.supportStyle} support · ${preferences.weeklyPlanningDay} check-in`;
}

export function formatQuietHours(value) {
  const time = normaliseProfilePreferences({ quietHoursStart: value }).quietHoursStart;
  const [hour, minute] = time.split(':').map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
}
