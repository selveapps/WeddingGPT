import { DEFAULT_PRIVACY_SETTINGS, PRIVACY_OPTIONS } from './privacyConstants';

export function normalisePrivacySettings(value) {
  const settings = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return PRIVACY_OPTIONS.reduce(
    (result, option) => ({
      ...result,
      [option.key]:
        typeof settings[option.key] === 'boolean'
          ? settings[option.key]
          : DEFAULT_PRIVACY_SETTINGS[option.key],
    }),
    {}
  );
}

export function togglePrivacySetting(settings, key) {
  if (!PRIVACY_OPTIONS.some((option) => option.key === key)) return settings;
  const current = normalisePrivacySettings(settings);
  return { ...current, [key]: !current[key] };
}

export function countEnabledPrivacySettings(settings) {
  return Object.values(normalisePrivacySettings(settings)).filter(Boolean).length;
}
