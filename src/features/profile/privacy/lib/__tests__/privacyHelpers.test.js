import {
  countEnabledPrivacySettings,
  normalisePrivacySettings,
  togglePrivacySetting,
} from '../privacyHelpers';
import { DEFAULT_PRIVACY_SETTINGS } from '../privacyConstants';

describe('profile privacy preferences', () => {
  it('fills missing values with privacy-conscious defaults', () => {
    expect(normalisePrivacySettings({ showWeddingLocation: false })).toEqual({
      ...DEFAULT_PRIVACY_SETTINGS,
      showWeddingLocation: false,
    });
  });

  it('toggles known settings without changing the input', () => {
    const initial = { ...DEFAULT_PRIVACY_SETTINGS };
    expect(togglePrivacySetting(initial, 'showContactDetails').showContactDetails).toBe(true);
    expect(initial.showContactDetails).toBe(false);
    expect(togglePrivacySetting(initial, 'unknown')).toBe(initial);
  });

  it('counts enabled choices after normalising incomplete data', () => {
    expect(countEnabledPrivacySettings({ showWeddingLocation: false })).toBe(1);
  });
});
