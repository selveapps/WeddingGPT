export const PACE_OPTIONS = [
  { value: 'gentle', label: 'Gentle', description: 'A little progress at a time' },
  { value: 'steady', label: 'Steady', description: 'A balanced planning rhythm' },
  { value: 'focused', label: 'Focused', description: 'More structure and momentum' },
];

export const SUPPORT_OPTIONS = [
  { value: 'short', label: 'Short and practical' },
  { value: 'warm', label: 'Warm and encouraging' },
  { value: 'detailed', label: 'Detailed and thorough' },
];

export const DEFAULT_PROFILE_PREFERENCES = {
  planningPace: 'steady',
  supportStyle: 'warm',
  weeklyPlanningDay: 'Sunday',
  quietHoursStart: '21:00',
};

export const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
