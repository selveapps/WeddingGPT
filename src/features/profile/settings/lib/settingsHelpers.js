/**
 * Pure helpers for Settings UI: formatting, validation messages, export
 * payloads, and bridging settings into ThemeProvider / notification services.
 */

import {
  DEFAULT_SETTINGS,
  privacyScore,
  listChangedKeys,
  isInQuietHours,
  resolveThemeScheme,
  ThemePreference,
  FontScalePreference,
  DensityPreference,
} from '@/store/settingsStore';
import { SETTINGS_COPY, SECTION_RESET_KEYS } from './settingsConstants';

/**
 * Map font scale preference to a numeric multiplier for text styles.
 */
export function fontScaleMultiplier(preference) {
  switch (preference) {
    case FontScalePreference.SMALL:
      return 0.9;
    case FontScalePreference.LARGE:
      return 1.15;
    case FontScalePreference.EXTRA_LARGE:
      return 1.3;
    default:
      return 1;
  }
}

/**
 * Map density to spacing scale factor used by layout helpers.
 */
export function densitySpacingFactor(preference) {
  switch (preference) {
    case DensityPreference.COMPACT:
      return 0.85;
    case DensityPreference.SPACIOUS:
      return 1.2;
    default:
      return 1;
  }
}

/**
 * Format a stored ISO timestamp for “Last export” rows.
 */
export function formatSettingsTimestamp(iso, locale = 'en-US') {
  if (!iso) return 'Never';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 'Unknown';
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  } catch {
    return String(iso);
  }
}

/**
 * Human label for privacy score (0–10).
 */
export function privacyScoreLabel(score, max = 10) {
  const ratio = score / max;
  if (ratio >= 0.8) return 'Very private';
  if (ratio >= 0.5) return 'Balanced';
  if (ratio >= 0.25) return 'Open';
  return 'Very open';
}

/**
 * Build a JSON-serialisable snapshot for export / support diagnostics.
 * Strips nothing sensitive beyond what the user already chose to store.
 */
export function buildSettingsExportPayload(settings, meta = {}) {
  const changed = listChangedKeys(settings);
  const privacy = privacyScore(settings);
  return {
    exportedAt: new Date().toISOString(),
    app: meta.appName ?? 'WeddingGPT',
    version: meta.version ?? null,
    settingsVersion: settings.settingsVersion ?? 1,
    changedKeys: changed,
    privacyScore: privacy,
    settings: { ...settings },
  };
}

/**
 * Apply theme preference side-effect for ThemeProvider consumers.
 * Callers should pass the ThemeProvider’s setPreference if available.
 */
export function applyThemePreference(preference, setThemePreference) {
  if (typeof setThemePreference !== 'function') return;
  if (!Object.values(ThemePreference).includes(preference)) return;
  setThemePreference(preference);
}

/**
 * Whether quiet hours are active right now (device local time).
 */
export function quietHoursActiveNow(settings) {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return isInQuietHours(settings, `${hh}:${mm}`);
}

/**
 * Summarise notification state for the hub subtitle.
 */
export function notificationSummary(settings) {
  if (!settings.notificationsEnabled) return 'All off';
  const channels = settings.notificationChannels || {};
  const on = Object.entries(channels)
    .filter(([, v]) => v)
    .map(([k]) => k);
  if (on.length === 0) return 'No channels';
  const quiet = settings.quietHoursEnabled
    ? ` · quiet ${settings.quietHoursStart}–${settings.quietHoursEnd}`
    : '';
  return `${on.length} channel${on.length === 1 ? '' : 's'}${quiet}`;
}

/**
 * Summarise appearance for hub.
 */
export function appearanceSummary(settings) {
  const theme =
    settings.themePreference === ThemePreference.SYSTEM
      ? 'System'
      : settings.themePreference === ThemePreference.DARK
        ? 'Dark'
        : 'Light';
  return `${theme} · ${settings.density} · ${settings.fontScale}`;
}

/**
 * Section-level “dirty” check vs defaults.
 */
export function sectionHasChanges(sectionId, settings) {
  const keys = SECTION_RESET_KEYS[sectionId];
  if (!keys) return false;
  const subset = {};
  const defaults = {};
  for (const key of keys) {
    subset[key] = settings[key];
    defaults[key] = DEFAULT_SETTINGS[key];
  }
  return listChangedKeys(subset, defaults).length > 0;
}

/**
 * Validate numeric setting from a text field; returns { ok, value, message }.
 */
export function parseClampedInt(raw, min, max, fallback) {
  const n = Number(String(raw).trim());
  if (!Number.isFinite(n)) {
    return { ok: false, value: fallback, message: `Enter a number between ${min} and ${max}` };
  }
  const clamped = Math.min(max, Math.max(min, Math.round(n)));
  if (clamped !== n) {
    return {
      ok: true,
      value: clamped,
      message: `Adjusted to ${clamped} (allowed ${min}–${max})`,
    };
  }
  return { ok: true, value: clamped, message: null };
}


/**
 * Copy for reset confirmation sheet body, including section name when scoped.
 */
export function resetConfirmCopy(sectionTitle) {
  if (!sectionTitle) {
    return {
      title: SETTINGS_COPY.resetConfirmTitle,
      body: SETTINGS_COPY.resetConfirmBody,
      action: SETTINGS_COPY.resetConfirmAction,
    };
  }
  return {
    title: `Reset ${sectionTitle}?`,
    body: `This restores defaults for ${sectionTitle.toLowerCase()}. Your wedding data is not deleted.`,
    action: SETTINGS_COPY.resetConfirmAction,
  };
}

/**
 * Map settings into a form the design-system ThemeProvider can consume.
 */
export function themeBridgeFromSettings(settings, systemScheme) {
  return {
    preference: settings.themePreference,
    scheme: resolveThemeScheme(settings.themePreference, systemScheme),
    fontScale: fontScaleMultiplier(settings.fontScale),
    density: densitySpacingFactor(settings.density),
    highContrast: Boolean(settings.highContrast),
    reduceTransparency: Boolean(settings.reduceTransparency),
  };
}

/**
 * Whether export reminder should fire based on lastExportAt and interval.
 */
export function shouldRemindExport(settings, now = new Date()) {
  if (!settings.remindToExport) return false;
  const days = settings.exportReminderDays ?? 30;
  if (!settings.lastExportAt) return true;
  const last = new Date(settings.lastExportAt);
  if (Number.isNaN(last.getTime())) return true;
  const elapsed = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
  return elapsed >= days;
}

/**
 * Safe deep clone of settings for comparison UIs.
 */
export function cloneSettings(settings) {
  return JSON.parse(JSON.stringify(settings));
}

/**
 * Diff two settings objects for a simple change log.
 */
export function diffSettings(before, after) {
  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  const changes = [];
  for (const key of keys) {
    const a = before?.[key];
    const b = after?.[key];
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      changes.push({ key, from: a, to: b });
    }
  }
  return changes;
}
