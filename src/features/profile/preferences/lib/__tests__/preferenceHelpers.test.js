import {
  describePreferenceSummary,
  formatQuietHours,
  normaliseProfilePreferences,
} from '../preferenceHelpers';
import { DEFAULT_PROFILE_PREFERENCES } from '../preferenceConstants';

describe('profile preference helpers', () => {
  it('normalises invalid or incomplete saved choices', () => {
    expect(normaliseProfilePreferences({ planningPace: 'turbo', weeklyPlanningDay: 'Someday' })).toEqual(
      DEFAULT_PROFILE_PREFERENCES
    );
  });

  it('summarises choices in readable copy', () => {
    expect(describePreferenceSummary(DEFAULT_PROFILE_PREFERENCES)).toBe(
      'Steady pace · warm support · Sunday check-in'
    );
  });

  it('formats a valid quiet-hour time and safely handles invalid values', () => {
    expect(formatQuietHours('18:30')).toBe('6:30 PM');
    expect(formatQuietHours('invalid')).toBe('9:00 PM');
  });
});
