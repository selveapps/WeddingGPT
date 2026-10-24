/**
 * settingsStore — device-level and wedding-level preferences that live outside
 * any single planning screen.
 *
 * Scope:
 *  - Appearance (theme, density, font scale, accent)
 *  - Notifications (channels, quiet hours, categories)
 *  - Privacy (analytics, crash reports, contact visibility)
 *  - Accessibility (reduce motion already in ThemeProvider; text size, contrast)
 *  - Language & region (locale, calendar, currency display override)
 *  - AI assistant behaviour
 *  - Data & storage (auto-backup, export reminders)
 *  - Wedding defaults (default RSVP window, meal choice required, etc.)
 *
 * Persistence: AsyncStorage via StorageKeys.PREFERENCES (merged) and a dedicated
 * settings slice. Workspace-scoped keys go through workspaceStorage so switching
 * wedding does not leak partner A preferences into partner B's device copy.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { zustandStorage, storage, StorageKeys } from '../services/storage';

// ---------------------------------------------------------------------------
// Constants & defaults
// ---------------------------------------------------------------------------

export const ThemePreference = Object.freeze({
  SYSTEM: 'system',
  LIGHT: 'light',
  DARK: 'dark',
});

export const DensityPreference = Object.freeze({
  COMFORTABLE: 'comfortable',
  COMPACT: 'compact',
  SPACIOUS: 'spacious',
});

export const FontScalePreference = Object.freeze({
  SMALL: 'small',
  DEFAULT: 'default',
  LARGE: 'large',
  EXTRA_LARGE: 'extraLarge',
});

export const AccentPreference = Object.freeze({
  BRAND: 'brand',
  ROSE: 'rose',
  SAGE: 'sage',
  GOLD: 'gold',
  SLATE: 'slate',
});

export const NotificationChannel = Object.freeze({
  PUSH: 'push',
  EMAIL: 'email',
  IN_APP: 'inApp',
});

export const NotificationCategory = Object.freeze({
  TASK_REMINDERS: 'taskReminders',
  BUDGET_ALERTS: 'budgetAlerts',
  GUEST_RSVP: 'guestRsvp',
  VENDOR_FOLLOW_UPS: 'vendorFollowUps',
  AI_SUGGESTIONS: 'aiSuggestions',
  WEDDING_MILESTONES: 'weddingMilestones',
  SYNC_STATUS: 'syncStatus',
  MARKETING: 'marketing',
});

export const PrivacyLevel = Object.freeze({
  EVERYONE: 'everyone',
  COUPLE_ONLY: 'coupleOnly',
  PRIVATE: 'private',
});

export const AIStyle = Object.freeze({
  CONCISE: 'concise',
  BALANCED: 'balanced',
  DETAILED: 'detailed',
  COACHING: 'coaching',
});

export const AITone = Object.freeze({
  WARM: 'warm',
  NEUTRAL: 'neutral',
  PROFESSIONAL: 'professional',
  PLAYFUL: 'playful',
});

export const CalendarSystem = Object.freeze({
  GREGORIAN: 'gregorian',
  HIJRI: 'hijri',
  HEBREW: 'hebrew',
});

export const WeekStart = Object.freeze({
  SUNDAY: 'sunday',
  MONDAY: 'monday',
  SATURDAY: 'saturday',
});

export const CurrencyDisplay = Object.freeze({
  SYMBOL: 'symbol',
  CODE: 'code',
  NAME: 'name',
});

export const BackupFrequency = Object.freeze({
  OFF: 'off',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  ON_CHANGE: 'onChange',
});

export const DEFAULT_SETTINGS = Object.freeze({
  // Appearance
  themePreference: ThemePreference.SYSTEM,
  density: DensityPreference.COMFORTABLE,
  fontScale: FontScalePreference.DEFAULT,
  accent: AccentPreference.BRAND,
  showDecorativeIllustrations: true,
  reduceTransparency: false,

  // Notifications
  notificationsEnabled: true,
  notificationChannels: {
    [NotificationChannel.PUSH]: true,
    [NotificationChannel.EMAIL]: false,
    [NotificationChannel.IN_APP]: true,
  },
  notificationCategories: {
    [NotificationCategory.TASK_REMINDERS]: true,
    [NotificationCategory.BUDGET_ALERTS]: true,
    [NotificationCategory.GUEST_RSVP]: true,
    [NotificationCategory.VENDOR_FOLLOW_UPS]: true,
    [NotificationCategory.AI_SUGGESTIONS]: true,
    [NotificationCategory.WEDDING_MILESTONES]: true,
    [NotificationCategory.SYNC_STATUS]: true,
    [NotificationCategory.MARKETING]: false,
  },
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  digestEnabled: false,
  digestTime: '09:00',
  digestDays: ['monday', 'thursday'],

  // Privacy
  analyticsEnabled: true,
  crashReportsEnabled: true,
  personalizationEnabled: true,
  shareUsageWithPartners: false,
  profileVisibility: PrivacyLevel.COUPLE_ONLY,
  guestListVisibility: PrivacyLevel.COUPLE_ONLY,
  budgetVisibility: PrivacyLevel.PRIVATE,
  allowContactImport: true,
  allowLocationForLocalVendors: true,

  // Accessibility
  highContrast: false,
  boldText: false,
  largerTouchTargets: false,
  screenReaderHints: true,
  announceNotifications: true,

  // Language & region
  locale: 'en-US',
  calendarSystem: CalendarSystem.GREGORIAN,
  weekStartsOn: WeekStart.SUNDAY,
  currencyDisplay: CurrencyDisplay.SYMBOL,
  dateFormat: 'medium',
  timeFormat: '12h',
  firstNameOrder: 'givenFamily',

  // AI
  aiStyle: AIStyle.BALANCED,
  aiTone: AITone.WARM,
  aiSuggestProactively: true,
  aiUseWeddingContext: true,
  aiRememberPreferences: true,
  aiMaxSuggestionsPerDay: 8,
  aiPreferLocalVendors: true,

  // Data & storage
  autoBackup: true,
  backupFrequency: BackupFrequency.WEEKLY,
  remindToExport: true,
  exportReminderDays: 30,
  keepDeletedItemsDays: 14,
  syncOnWifiOnly: false,
  clearCacheOnLogout: false,

  // Wedding defaults
  defaultRsvpWindowDays: 21,
  requireMealChoice: true,
  requirePlusOneDecision: false,
  defaultGuestVisibility: 'household',
  showBudgetOnHome: true,
  showCountdownOnHome: true,
  defaultTaskLeadDays: 14,
  packingListReminderDays: 7,

  // About / meta
  hasSeenSettingsTour: false,
  lastExportAt: null,
  lastBackupAt: null,
  settingsVersion: 1,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function deepMerge(base, patch) {
  if (patch == null || typeof patch !== 'object') return base;
  const out = { ...base };
  for (const key of Object.keys(patch)) {
    const next = patch[key];
    const prev = base[key];
    if (
      next != null &&
      typeof next === 'object' &&
      !Array.isArray(next) &&
      prev != null &&
      typeof prev === 'object' &&
      !Array.isArray(prev)
    ) {
      out[key] = deepMerge(prev, next);
    } else if (next !== undefined) {
      out[key] = next;
    }
  }
  return out;
}

function isValidTime(value) {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/**
 * Validate and normalise a partial settings patch before writing.
 * Unknown keys are ignored; invalid enum values fall back to current/default.
 */
export function normaliseSettingsPatch(patch, current = DEFAULT_SETTINGS) {
  if (!patch || typeof patch !== 'object') return {};
  const next = {};

  const enumFields = {
    themePreference: ThemePreference,
    density: DensityPreference,
    fontScale: FontScalePreference,
    accent: AccentPreference,
    profileVisibility: PrivacyLevel,
    guestListVisibility: PrivacyLevel,
    budgetVisibility: PrivacyLevel,
    aiStyle: AIStyle,
    aiTone: AITone,
    calendarSystem: CalendarSystem,
    weekStartsOn: WeekStart,
    currencyDisplay: CurrencyDisplay,
    backupFrequency: BackupFrequency,
  };

  for (const [key, enumObj] of Object.entries(enumFields)) {
    if (patch[key] !== undefined) {
      const allowed = Object.values(enumObj);
      next[key] = allowed.includes(patch[key]) ? patch[key] : current[key];
    }
  }

  const boolFields = [
    'showDecorativeIllustrations',
    'reduceTransparency',
    'notificationsEnabled',
    'quietHoursEnabled',
    'digestEnabled',
    'analyticsEnabled',
    'crashReportsEnabled',
    'personalizationEnabled',
    'shareUsageWithPartners',
    'allowContactImport',
    'allowLocationForLocalVendors',
    'highContrast',
    'boldText',
    'largerTouchTargets',
    'screenReaderHints',
    'announceNotifications',
    'aiSuggestProactively',
    'aiUseWeddingContext',
    'aiRememberPreferences',
    'aiPreferLocalVendors',
    'autoBackup',
    'remindToExport',
    'syncOnWifiOnly',
    'clearCacheOnLogout',
    'requireMealChoice',
    'requirePlusOneDecision',
    'showBudgetOnHome',
    'showCountdownOnHome',
    'hasSeenSettingsTour',
  ];

  for (const key of boolFields) {
    if (patch[key] !== undefined) {
      next[key] = Boolean(patch[key]);
    }
  }

  if (patch.notificationChannels && typeof patch.notificationChannels === 'object') {
    next.notificationChannels = {
      ...current.notificationChannels,
      ...Object.fromEntries(
        Object.entries(patch.notificationChannels).map(([k, v]) => [k, Boolean(v)])
      ),
    };
  }

  if (patch.notificationCategories && typeof patch.notificationCategories === 'object') {
    next.notificationCategories = {
      ...current.notificationCategories,
      ...Object.fromEntries(
        Object.entries(patch.notificationCategories).map(([k, v]) => [k, Boolean(v)])
      ),
    };
  }

  if (patch.quietHoursStart !== undefined) {
    next.quietHoursStart = isValidTime(patch.quietHoursStart)
      ? patch.quietHoursStart
      : current.quietHoursStart;
  }
  if (patch.quietHoursEnd !== undefined) {
    next.quietHoursEnd = isValidTime(patch.quietHoursEnd)
      ? patch.quietHoursEnd
      : current.quietHoursEnd;
  }
  if (patch.digestTime !== undefined) {
    next.digestTime = isValidTime(patch.digestTime) ? patch.digestTime : current.digestTime;
  }

  if (Array.isArray(patch.digestDays)) {
    const allowed = new Set([
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ]);
    next.digestDays = patch.digestDays.filter((d) => allowed.has(String(d).toLowerCase()));
  }

  if (patch.locale !== undefined) {
    next.locale = typeof patch.locale === 'string' && patch.locale.length >= 2
      ? patch.locale
      : current.locale;
  }

  if (patch.dateFormat !== undefined) {
    next.dateFormat = ['short', 'medium', 'long', 'full'].includes(patch.dateFormat)
      ? patch.dateFormat
      : current.dateFormat;
  }
  if (patch.timeFormat !== undefined) {
    next.timeFormat = ['12h', '24h'].includes(patch.timeFormat)
      ? patch.timeFormat
      : current.timeFormat;
  }
  if (patch.firstNameOrder !== undefined) {
    next.firstNameOrder = ['givenFamily', 'familyGiven'].includes(patch.firstNameOrder)
      ? patch.firstNameOrder
      : current.firstNameOrder;
  }

  if (patch.aiMaxSuggestionsPerDay !== undefined) {
    next.aiMaxSuggestionsPerDay = clampInt(patch.aiMaxSuggestionsPerDay, 0, 50, current.aiMaxSuggestionsPerDay);
  }
  if (patch.exportReminderDays !== undefined) {
    next.exportReminderDays = clampInt(patch.exportReminderDays, 7, 365, current.exportReminderDays);
  }
  if (patch.keepDeletedItemsDays !== undefined) {
    next.keepDeletedItemsDays = clampInt(patch.keepDeletedItemsDays, 0, 90, current.keepDeletedItemsDays);
  }
  if (patch.defaultRsvpWindowDays !== undefined) {
    next.defaultRsvpWindowDays = clampInt(patch.defaultRsvpWindowDays, 3, 90, current.defaultRsvpWindowDays);
  }
  if (patch.defaultTaskLeadDays !== undefined) {
    next.defaultTaskLeadDays = clampInt(patch.defaultTaskLeadDays, 1, 120, current.defaultTaskLeadDays);
  }
  if (patch.packingListReminderDays !== undefined) {
    next.packingListReminderDays = clampInt(
      patch.packingListReminderDays,
      1,
      30,
      current.packingListReminderDays
    );
  }

  if (patch.defaultGuestVisibility !== undefined) {
    next.defaultGuestVisibility = ['household', 'all', 'private'].includes(patch.defaultGuestVisibility)
      ? patch.defaultGuestVisibility
      : current.defaultGuestVisibility;
  }

  if (patch.lastExportAt !== undefined) {
    next.lastExportAt = patch.lastExportAt == null ? null : String(patch.lastExportAt);
  }
  if (patch.lastBackupAt !== undefined) {
    next.lastBackupAt = patch.lastBackupAt == null ? null : String(patch.lastBackupAt);
  }

  return next;
}

/**
 * Compute a human-readable summary of how "locked down" privacy is.
 */
export function privacyScore(settings) {
  let score = 0;
  const max = 10;
  if (!settings.analyticsEnabled) score += 1;
  if (!settings.crashReportsEnabled) score += 1;
  if (!settings.personalizationEnabled) score += 1;
  if (!settings.shareUsageWithPartners) score += 1;
  if (settings.profileVisibility === PrivacyLevel.PRIVATE) score += 2;
  else if (settings.profileVisibility === PrivacyLevel.COUPLE_ONLY) score += 1;
  if (settings.guestListVisibility === PrivacyLevel.PRIVATE) score += 1;
  if (settings.budgetVisibility === PrivacyLevel.PRIVATE) score += 1;
  if (!settings.allowContactImport) score += 0.5;
  if (!settings.allowLocationForLocalVendors) score += 0.5;
  return { score: Math.min(max, Math.round(score * 10) / 10), max };
}

/**
 * Whether any notification channel that can interrupt the user is active.
 */
export function hasActiveInterruptingNotifications(settings) {
  if (!settings.notificationsEnabled) return false;
  return Boolean(
    settings.notificationChannels?.[NotificationChannel.PUSH] ||
      settings.notificationChannels?.[NotificationChannel.EMAIL]
  );
}

/**
 * Resolve effective theme scheme name given preference and system scheme.
 */
export function resolveThemeScheme(preference, systemScheme) {
  if (preference === ThemePreference.LIGHT) return 'light';
  if (preference === ThemePreference.DARK) return 'dark';
  return systemScheme === 'dark' ? 'dark' : 'light';
}

/**
 * Quiet-hours check for a given local HH:mm string.
 */
export function isInQuietHours(settings, nowHhMm) {
  if (!settings.quietHoursEnabled) return false;
  if (!isValidTime(nowHhMm)) return false;
  const start = settings.quietHoursStart;
  const end = settings.quietHoursEnd;
  if (start === end) return true;
  if (start < end) {
    return nowHhMm >= start && nowHhMm < end;
  }
  // wraps midnight
  return nowHhMm >= start || nowHhMm < end;
}

/**
 * Build a flat list of setting keys that differ from defaults (for "reset" UI).
 */
export function listChangedKeys(settings, defaults = DEFAULT_SETTINGS) {
  const changed = [];
  for (const key of Object.keys(defaults)) {
    const a = settings[key];
    const b = defaults[key];
    if (typeof a === 'object' && a != null && !Array.isArray(a)) {
      if (JSON.stringify(a) !== JSON.stringify(b)) changed.push(key);
    } else if (Array.isArray(a)) {
      if (JSON.stringify(a) !== JSON.stringify(b)) changed.push(key);
    } else if (a !== b) {
      changed.push(key);
    }
  }
  return changed;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export function createSettingsStore(options = {}) {
  const storageAdapter = options.storage ?? zustandStorage;
  const onChange = options.onChange ?? (() => {});

  return create(
    persist(
      (set, get) => ({
        ...DEFAULT_SETTINGS,
        _hydrated: false,

        setSetting(key, value) {
          const current = get();
          const patch = normaliseSettingsPatch({ [key]: value }, current);
          if (Object.keys(patch).length === 0) return;
          set(patch);
          onChange(patch, get());
        },

        setSettings(partial) {
          const current = get();
          const patch = normaliseSettingsPatch(partial, current);
          if (Object.keys(patch).length === 0) return;
          set(patch);
          onChange(patch, get());
        },

        setNotificationChannel(channel, enabled) {
          const current = get();
          const channels = {
            ...current.notificationChannels,
            [channel]: Boolean(enabled),
          };
          get().setSettings({ notificationChannels: channels });
        },

        setNotificationCategory(category, enabled) {
          const current = get();
          const categories = {
            ...current.notificationCategories,
            [category]: Boolean(enabled),
          };
          get().setSettings({ notificationCategories: categories });
        },

        toggle(key) {
          const current = get();
          if (typeof current[key] !== 'boolean') return;
          get().setSetting(key, !current[key]);
        },

        resetSection(sectionKeys) {
          const defaults = DEFAULT_SETTINGS;
          const patch = {};
          for (const key of sectionKeys) {
            if (key in defaults) patch[key] = defaults[key];
          }
          get().setSettings(patch);
        },

        resetAll() {
          const {
            hasSeenSettingsTour,
            lastExportAt,
            lastBackupAt,
            settingsVersion,
            ...rest
          } = DEFAULT_SETTINGS;
          set({
            ...rest,
            hasSeenSettingsTour: get().hasSeenSettingsTour,
            lastExportAt: get().lastExportAt,
            lastBackupAt: get().lastBackupAt,
            settingsVersion: get().settingsVersion,
          });
          onChange(rest, get());
        },

        markExport(at = new Date().toISOString()) {
          set({ lastExportAt: at });
        },

        markBackup(at = new Date().toISOString()) {
          set({ lastBackupAt: at });
        },

        markSettingsTourSeen() {
          set({ hasSeenSettingsTour: true });
        },

        /**
         * Merge legacy prefs:user themePreference into this store once.
         */
        async migrateFromLegacyPreferences() {
          try {
            const legacy = await storage.get(StorageKeys.PREFERENCES);
            if (!legacy || typeof legacy !== 'object') return;
            const patch = {};
            if (legacy.themePreference && Object.values(ThemePreference).includes(legacy.themePreference)) {
              patch.themePreference = legacy.themePreference;
            }
            if (Object.keys(patch).length) {
              get().setSettings(patch);
            }
          } catch {
            // non-fatal
          }
        },
      }),
      {
        name: 'settings:app',
        storage: createJSONStorage(() => storageAdapter),
        version: 1,
        partialize: (state) => {
          const { _hydrated, setSetting, setSettings, setNotificationChannel, setNotificationCategory, toggle, resetSection, resetAll, markExport, markBackup, markSettingsTourSeen, migrateFromLegacyPreferences, ...rest } = state;
          return rest;
        },
        onRehydrateStorage: () => (state) => {
          if (state) state._hydrated = true;
        },
        merge: (persisted, current) => deepMerge(current, persisted ?? {}),
      }
    )
  );
}

/** Singleton used by the app. Tests should call createSettingsStore(). */
export const useSettingsStore = createSettingsStore();

// Selectors -----------------------------------------------------------------

export const selectThemePreference = (s) => s.themePreference;
export const selectDensity = (s) => s.density;
export const selectFontScale = (s) => s.fontScale;
export const selectAccent = (s) => s.accent;
export const selectNotificationsEnabled = (s) => s.notificationsEnabled;
export const selectNotificationChannels = (s) => s.notificationChannels;
export const selectNotificationCategories = (s) => s.notificationCategories;
export const selectQuietHours = (s) => ({
  enabled: s.quietHoursEnabled,
  start: s.quietHoursStart,
  end: s.quietHoursEnd,
});
export const selectPrivacy = (s) => ({
  analyticsEnabled: s.analyticsEnabled,
  crashReportsEnabled: s.crashReportsEnabled,
  personalizationEnabled: s.personalizationEnabled,
  shareUsageWithPartners: s.shareUsageWithPartners,
  profileVisibility: s.profileVisibility,
  guestListVisibility: s.guestListVisibility,
  budgetVisibility: s.budgetVisibility,
  allowContactImport: s.allowContactImport,
  allowLocationForLocalVendors: s.allowLocationForLocalVendors,
});
export const selectAI = (s) => ({
  style: s.aiStyle,
  tone: s.aiTone,
  suggestProactively: s.aiSuggestProactively,
  useWeddingContext: s.aiUseWeddingContext,
  rememberPreferences: s.aiRememberPreferences,
  maxSuggestionsPerDay: s.aiMaxSuggestionsPerDay,
  preferLocalVendors: s.aiPreferLocalVendors,
});
export const selectLocale = (s) => ({
  locale: s.locale,
  calendarSystem: s.calendarSystem,
  weekStartsOn: s.weekStartsOn,
  currencyDisplay: s.currencyDisplay,
  dateFormat: s.dateFormat,
  timeFormat: s.timeFormat,
  firstNameOrder: s.firstNameOrder,
});
export const selectAccessibility = (s) => ({
  highContrast: s.highContrast,
  boldText: s.boldText,
  largerTouchTargets: s.largerTouchTargets,
  screenReaderHints: s.screenReaderHints,
  announceNotifications: s.announceNotifications,
  reduceTransparency: s.reduceTransparency,
});
export const selectDataSettings = (s) => ({
  autoBackup: s.autoBackup,
  backupFrequency: s.backupFrequency,
  remindToExport: s.remindToExport,
  exportReminderDays: s.exportReminderDays,
  keepDeletedItemsDays: s.keepDeletedItemsDays,
  syncOnWifiOnly: s.syncOnWifiOnly,
  clearCacheOnLogout: s.clearCacheOnLogout,
  lastExportAt: s.lastExportAt,
  lastBackupAt: s.lastBackupAt,
});
export const selectWeddingDefaults = (s) => ({
  defaultRsvpWindowDays: s.defaultRsvpWindowDays,
  requireMealChoice: s.requireMealChoice,
  requirePlusOneDecision: s.requirePlusOneDecision,
  defaultGuestVisibility: s.defaultGuestVisibility,
  showBudgetOnHome: s.showBudgetOnHome,
  showCountdownOnHome: s.showCountdownOnHome,
  defaultTaskLeadDays: s.defaultTaskLeadDays,
  packingListReminderDays: s.packingListReminderDays,
});
export const selectSettingsHydrated = (s) => s._hydrated;

export default useSettingsStore;
