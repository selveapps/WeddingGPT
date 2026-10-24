/**
 * Copy, option lists, section metadata and route keys for the Settings feature.
 * Keep user-facing strings here so screens stay declarative.
 */

import {
  ThemePreference,
  DensityPreference,
  FontScalePreference,
  AccentPreference,
  NotificationChannel,
  NotificationCategory,
  PrivacyLevel,
  AIStyle,
  AITone,
  CalendarSystem,
  WeekStart,
  CurrencyDisplay,
  BackupFrequency,
} from '@/store/settingsStore';

export const SETTINGS_SECTIONS = Object.freeze({
  APPEARANCE: 'appearance',
  NOTIFICATIONS: 'notifications',
  PRIVACY: 'privacy',
  ACCESSIBILITY: 'accessibility',
  LANGUAGE: 'language',
  AI: 'ai',
  DATA: 'data',
  WEDDING_DEFAULTS: 'weddingDefaults',
  ABOUT: 'about',
});

export const SETTINGS_SECTION_META = Object.freeze({
  [SETTINGS_SECTIONS.APPEARANCE]: {
    id: SETTINGS_SECTIONS.APPEARANCE,
    title: 'Appearance',
    subtitle: 'Theme, density and visual polish',
    icon: 'palette',
    routeKey: 'settingsAppearance',
  },
  [SETTINGS_SECTIONS.NOTIFICATIONS]: {
    id: SETTINGS_SECTIONS.NOTIFICATIONS,
    title: 'Notifications',
    subtitle: 'Channels, quiet hours and digests',
    icon: 'bell',
    routeKey: 'settingsNotifications',
  },
  [SETTINGS_SECTIONS.PRIVACY]: {
    id: SETTINGS_SECTIONS.PRIVACY,
    title: 'Privacy & security',
    subtitle: 'What we share and what stays on device',
    icon: 'shield',
    routeKey: 'settingsPrivacy',
  },
  [SETTINGS_SECTIONS.ACCESSIBILITY]: {
    id: SETTINGS_SECTIONS.ACCESSIBILITY,
    title: 'Accessibility',
    subtitle: 'Contrast, text size and motion',
    icon: 'accessibility',
    routeKey: 'settingsAccessibility',
  },
  [SETTINGS_SECTIONS.LANGUAGE]: {
    id: SETTINGS_SECTIONS.LANGUAGE,
    title: 'Language & region',
    subtitle: 'Locale, calendar and number formats',
    icon: 'globe',
    routeKey: 'settingsLanguage',
  },
  [SETTINGS_SECTIONS.AI]: {
    id: SETTINGS_SECTIONS.AI,
    title: 'AI assistant',
    subtitle: 'Style, tone and suggestion limits',
    icon: 'sparkles',
    routeKey: 'settingsAI',
  },
  [SETTINGS_SECTIONS.DATA]: {
    id: SETTINGS_SECTIONS.DATA,
    title: 'Data & storage',
    subtitle: 'Backups, export and cache',
    icon: 'database',
    routeKey: 'settingsData',
  },
  [SETTINGS_SECTIONS.WEDDING_DEFAULTS]: {
    id: SETTINGS_SECTIONS.WEDDING_DEFAULTS,
    title: 'Wedding defaults',
    subtitle: 'RSVP windows, meals and home cards',
    icon: 'heart',
    routeKey: 'settingsWeddingDefaults',
  },
  [SETTINGS_SECTIONS.ABOUT]: {
    id: SETTINGS_SECTIONS.ABOUT,
    title: 'About',
    subtitle: 'Version, licences and support',
    icon: 'info',
    routeKey: 'settingsAbout',
  },
});

export const SETTINGS_HUB_LINKS = Object.values(SETTINGS_SECTION_META);

export const SETTINGS_COPY = Object.freeze({
  hubEyebrow: 'Preferences',
  hubTitle: 'Settings',
  hubSubtitle: 'How WeddingGPT looks, notifies and protects your plans.',
  searchPlaceholder: 'Search settings…',
  resetSection: 'Reset this section',
  resetAll: 'Reset all settings',
  resetConfirmTitle: 'Reset settings?',
  resetConfirmBody:
    'This restores defaults for the selected options. Your wedding data, guests and budget are not deleted.',
  resetConfirmAction: 'Reset',
  saveToast: 'Settings saved',
  themeLabel: 'Colour theme',
  themeDescription: 'Match the system, or lock light or dark.',
  densityLabel: 'Layout density',
  densityDescription: 'How much space rows and cards use.',
  fontScaleLabel: 'Text size',
  fontScaleDescription: 'Scales most body and label text in the app.',
  accentLabel: 'Accent colour',
  accentDescription: 'Highlights, chips and primary buttons.',
  illustrationsLabel: 'Decorative illustrations',
  illustrationsDescription: 'Empty states and celebration moments.',
  reduceTransparencyLabel: 'Reduce transparency',
  reduceTransparencyDescription: 'Solid surfaces instead of frosted overlays.',
  notificationsMaster: 'All notifications',
  notificationsMasterDescription: 'Master switch for push, email and in-app alerts.',
  channelsTitle: 'Channels',
  categoriesTitle: 'What we can notify about',
  quietHoursTitle: 'Quiet hours',
  quietHoursDescription: 'Silence push alerts between these times (local).',
  digestTitle: 'Weekly digest',
  digestDescription: 'A summary of upcoming tasks and RSVPs.',
  analyticsLabel: 'Usage analytics',
  analyticsDescription: 'Anonymous product usage to improve the app.',
  crashLabel: 'Crash reports',
  crashDescription: 'Send diagnostics when something goes wrong.',
  personalizationLabel: 'Personalisation',
  personalizationDescription: 'Use your wedding context for better suggestions.',
  sharePartnersLabel: 'Share usage with your partner',
  sharePartnersDescription: 'Optional activity signals in a shared workspace.',
  visibilityProfile: 'Profile visibility',
  visibilityGuests: 'Guest list visibility',
  visibilityBudget: 'Budget visibility',
  contactImportLabel: 'Allow contact import',
  locationVendorsLabel: 'Use location for local vendors',
  highContrastLabel: 'Higher contrast',
  boldTextLabel: 'Bold text',
  largerTargetsLabel: 'Larger touch targets',
  screenReaderLabel: 'Extra screen-reader hints',
  announceLabel: 'Announce notifications',
  localeLabel: 'Language',
  calendarLabel: 'Calendar system',
  weekStartLabel: 'Week starts on',
  currencyDisplayLabel: 'Currency display',
  dateFormatLabel: 'Date format',
  timeFormatLabel: 'Time format',
  nameOrderLabel: 'Name order',
  aiStyleLabel: 'Answer style',
  aiToneLabel: 'Tone',
  aiProactiveLabel: 'Suggest proactively',
  aiContextLabel: 'Use full wedding context',
  aiRememberLabel: 'Remember my preferences',
  aiMaxLabel: 'Max suggestions per day',
  aiLocalLabel: 'Prefer local vendors',
  autoBackupLabel: 'Automatic backups',
  backupFrequencyLabel: 'Backup frequency',
  remindExportLabel: 'Remind me to export',
  exportDaysLabel: 'Export reminder every (days)',
  keepDeletedLabel: 'Keep deleted items (days)',
  wifiOnlyLabel: 'Sync on Wi‑Fi only',
  clearCacheLabel: 'Clear cache on sign-out',
  rsvpWindowLabel: 'Default RSVP window (days)',
  mealChoiceLabel: 'Require meal choice',
  plusOneLabel: 'Require plus-one decision',
  guestVisibilityLabel: 'Default guest visibility',
  showBudgetHomeLabel: 'Show budget card on Home',
  showCountdownHomeLabel: 'Show countdown on Home',
  taskLeadLabel: 'Default task lead time (days)',
  packingReminderLabel: 'Packing list reminder (days)',
  aboutVersion: 'App version',
  aboutBuild: 'Build',
  aboutLicences: 'Open-source licences',
  aboutPrivacy: 'Privacy policy',
  aboutTerms: 'Terms of use',
  aboutSupport: 'Contact support',
  aboutRate: 'Rate the app',
  emptySearch: 'No settings match that search.',
  tourTitle: 'Settings tour',
  tourBody: 'Theme, notifications and privacy live here. Changes apply immediately.',
});

export const THEME_OPTIONS = [
  {
    value: ThemePreference.SYSTEM,
    label: 'System',
    description: 'Follow the device setting',
  },
  {
    value: ThemePreference.LIGHT,
    label: 'Light',
    description: 'Always light',
  },
  {
    value: ThemePreference.DARK,
    label: 'Dark',
    description: 'Always dark',
  },
];

export const DENSITY_OPTIONS = [
  {
    value: DensityPreference.COMPACT,
    label: 'Compact',
    description: 'More on screen',
  },
  {
    value: DensityPreference.COMFORTABLE,
    label: 'Comfortable',
    description: 'Balanced spacing',
  },
  {
    value: DensityPreference.SPACIOUS,
    label: 'Spacious',
    description: 'Room to breathe',
  },
];

export const FONT_SCALE_OPTIONS = [
  { value: FontScalePreference.SMALL, label: 'Small' },
  { value: FontScalePreference.DEFAULT, label: 'Default' },
  { value: FontScalePreference.LARGE, label: 'Large' },
  { value: FontScalePreference.EXTRA_LARGE, label: 'Extra large' },
];

export const ACCENT_OPTIONS = [
  { value: AccentPreference.BRAND, label: 'Brand rose' },
  { value: AccentPreference.ROSE, label: 'Soft rose' },
  { value: AccentPreference.SAGE, label: 'Sage' },
  { value: AccentPreference.GOLD, label: 'Gold' },
  { value: AccentPreference.SLATE, label: 'Slate' },
];

export const CHANNEL_OPTIONS = [
  {
    value: NotificationChannel.PUSH,
    label: 'Push',
    description: 'Alerts on this device',
  },
  {
    value: NotificationChannel.EMAIL,
    label: 'Email',
    description: 'When an account email is set',
  },
  {
    value: NotificationChannel.IN_APP,
    label: 'In-app',
    description: 'Inbox and banners inside the app',
  },
];

export const CATEGORY_OPTIONS = [
  {
    value: NotificationCategory.TASK_REMINDERS,
    label: 'Task reminders',
    description: 'Due dates and planning nudges',
  },
  {
    value: NotificationCategory.BUDGET_ALERTS,
    label: 'Budget alerts',
    description: 'Overspend and category limits',
  },
  {
    value: NotificationCategory.GUEST_RSVP,
    label: 'Guest RSVPs',
    description: 'New replies and missing responses',
  },
  {
    value: NotificationCategory.VENDOR_FOLLOW_UPS,
    label: 'Vendor follow-ups',
    description: 'Quotes and booking deadlines',
  },
  {
    value: NotificationCategory.AI_SUGGESTIONS,
    label: 'AI suggestions',
    description: 'Proactive ideas from the assistant',
  },
  {
    value: NotificationCategory.WEDDING_MILESTONES,
    label: 'Milestones',
    description: 'Countdowns and celebration moments',
  },
  {
    value: NotificationCategory.SYNC_STATUS,
    label: 'Sync status',
    description: 'Conflicts and failed uploads',
  },
  {
    value: NotificationCategory.MARKETING,
    label: 'Product updates',
    description: 'Occasional news about WeddingGPT',
  },
];

export const PRIVACY_LEVEL_OPTIONS = [
  {
    value: PrivacyLevel.EVERYONE,
    label: 'Everyone with the link',
    description: 'Anyone you share with can see this',
  },
  {
    value: PrivacyLevel.COUPLE_ONLY,
    label: 'Couple only',
    description: 'You and your partner',
  },
  {
    value: PrivacyLevel.PRIVATE,
    label: 'Private',
    description: 'Only on this device / your account',
  },
];

export const AI_STYLE_OPTIONS = [
  {
    value: AIStyle.CONCISE,
    label: 'Concise',
    description: 'Short answers, fewer paragraphs',
  },
  {
    value: AIStyle.BALANCED,
    label: 'Balanced',
    description: 'Clear and complete without overload',
  },
  {
    value: AIStyle.DETAILED,
    label: 'Detailed',
    description: 'Longer explanations and checklists',
  },
  {
    value: AIStyle.COACHING,
    label: 'Coaching',
    description: 'Guided steps and reflective questions',
  },
];

export const AI_TONE_OPTIONS = [
  { value: AITone.WARM, label: 'Warm' },
  { value: AITone.NEUTRAL, label: 'Neutral' },
  { value: AITone.PROFESSIONAL, label: 'Professional' },
  { value: AITone.PLAYFUL, label: 'Playful' },
];

export const CALENDAR_OPTIONS = [
  { value: CalendarSystem.GREGORIAN, label: 'Gregorian' },
  { value: CalendarSystem.HIJRI, label: 'Hijri' },
  { value: CalendarSystem.HEBREW, label: 'Hebrew' },
];

export const WEEK_START_OPTIONS = [
  { value: WeekStart.SUNDAY, label: 'Sunday' },
  { value: WeekStart.MONDAY, label: 'Monday' },
  { value: WeekStart.SATURDAY, label: 'Saturday' },
];

export const CURRENCY_DISPLAY_OPTIONS = [
  { value: CurrencyDisplay.SYMBOL, label: 'Symbol ($)' },
  { value: CurrencyDisplay.CODE, label: 'Code (USD)' },
  { value: CurrencyDisplay.NAME, label: 'Name (US dollar)' },
];

export const DATE_FORMAT_OPTIONS = [
  { value: 'short', label: 'Short' },
  { value: 'medium', label: 'Medium' },
  { value: 'long', label: 'Long' },
  { value: 'full', label: 'Full' },
];

export const TIME_FORMAT_OPTIONS = [
  { value: '12h', label: '12-hour' },
  { value: '24h', label: '24-hour' },
];

export const NAME_ORDER_OPTIONS = [
  { value: 'givenFamily', label: 'Given name first' },
  { value: 'familyGiven', label: 'Family name first' },
];

export const BACKUP_FREQUENCY_OPTIONS = [
  { value: BackupFrequency.OFF, label: 'Off' },
  { value: BackupFrequency.DAILY, label: 'Daily' },
  { value: BackupFrequency.WEEKLY, label: 'Weekly' },
  { value: BackupFrequency.ON_CHANGE, label: 'On every change' },
];

export const GUEST_VISIBILITY_OPTIONS = [
  { value: 'household', label: 'Household' },
  { value: 'all', label: 'All guests' },
  { value: 'private', label: 'Private' },
];

export const QUIET_HOUR_OPTIONS = [
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '22:00',
  '23:00',
  '00:00',
].map((t) => ({ value: t, label: t }));

export const QUIET_HOUR_END_OPTIONS = [
  '05:00',
  '06:00',
  '07:00',
  '08:00',
  '09:00',
].map((t) => ({ value: t, label: t }));

export const DIGEST_TIME_OPTIONS = ['07:00', '08:00', '09:00', '10:00', '18:00', '20:00'].map(
  (t) => ({ value: t, label: t })
);

export const DIGEST_DAY_OPTIONS = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
  { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' },
];

export const LOCALE_OPTIONS = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'en-IN', label: 'English (India)' },
  { value: 'hi-IN', label: 'Hindi (India)' },
  { value: 'es-ES', label: 'Spanish (Spain)' },
  { value: 'es-MX', label: 'Spanish (Mexico)' },
  { value: 'fr-FR', label: 'French' },
  { value: 'de-DE', label: 'German' },
  { value: 'pt-BR', label: 'Portuguese (Brazil)' },
  { value: 'ar-SA', label: 'Arabic' },
  { value: 'he-IL', label: 'Hebrew' },
  { value: 'zh-CN', label: 'Chinese (Simplified)' },
  { value: 'ja-JP', label: 'Japanese' },
  { value: 'ko-KR', label: 'Korean' },
];

/** Keys reset together when the user taps “Reset this section”. */
export const SECTION_RESET_KEYS = Object.freeze({
  [SETTINGS_SECTIONS.APPEARANCE]: [
    'themePreference',
    'density',
    'fontScale',
    'accent',
    'showDecorativeIllustrations',
    'reduceTransparency',
  ],
  [SETTINGS_SECTIONS.NOTIFICATIONS]: [
    'notificationsEnabled',
    'notificationChannels',
    'notificationCategories',
    'quietHoursEnabled',
    'quietHoursStart',
    'quietHoursEnd',
    'digestEnabled',
    'digestTime',
    'digestDays',
  ],
  [SETTINGS_SECTIONS.PRIVACY]: [
    'analyticsEnabled',
    'crashReportsEnabled',
    'personalizationEnabled',
    'shareUsageWithPartners',
    'profileVisibility',
    'guestListVisibility',
    'budgetVisibility',
    'allowContactImport',
    'allowLocationForLocalVendors',
  ],
  [SETTINGS_SECTIONS.ACCESSIBILITY]: [
    'highContrast',
    'boldText',
    'largerTouchTargets',
    'screenReaderHints',
    'announceNotifications',
    'reduceTransparency',
  ],
  [SETTINGS_SECTIONS.LANGUAGE]: [
    'locale',
    'calendarSystem',
    'weekStartsOn',
    'currencyDisplay',
    'dateFormat',
    'timeFormat',
    'firstNameOrder',
  ],
  [SETTINGS_SECTIONS.AI]: [
    'aiStyle',
    'aiTone',
    'aiSuggestProactively',
    'aiUseWeddingContext',
    'aiRememberPreferences',
    'aiMaxSuggestionsPerDay',
    'aiPreferLocalVendors',
  ],
  [SETTINGS_SECTIONS.DATA]: [
    'autoBackup',
    'backupFrequency',
    'remindToExport',
    'exportReminderDays',
    'keepDeletedItemsDays',
    'syncOnWifiOnly',
    'clearCacheOnLogout',
  ],
  [SETTINGS_SECTIONS.WEDDING_DEFAULTS]: [
    'defaultRsvpWindowDays',
    'requireMealChoice',
    'requirePlusOneDecision',
    'defaultGuestVisibility',
    'showBudgetOnHome',
    'showCountdownOnHome',
    'defaultTaskLeadDays',
    'packingListReminderDays',
  ],
});

/**
 * Search index: plain-text terms → section id for hub search.
 */
export const SETTINGS_SEARCH_INDEX = [
  { terms: ['theme', 'dark', 'light', 'appearance', 'colour', 'color', 'accent', 'font', 'density'], section: SETTINGS_SECTIONS.APPEARANCE },
  { terms: ['notification', 'push', 'email', 'quiet', 'digest', 'alert', 'reminder', 'bell'], section: SETTINGS_SECTIONS.NOTIFICATIONS },
  { terms: ['privacy', 'analytics', 'crash', 'visibility', 'security', 'contact', 'location'], section: SETTINGS_SECTIONS.PRIVACY },
  { terms: ['accessibility', 'contrast', 'bold', 'touch', 'screen reader', 'a11y'], section: SETTINGS_SECTIONS.ACCESSIBILITY },
  { terms: ['language', 'locale', 'region', 'calendar', 'currency', 'date', 'time'], section: SETTINGS_SECTIONS.LANGUAGE },
  { terms: ['ai', 'assistant', 'tone', 'style', 'suggestion', 'gpt'], section: SETTINGS_SECTIONS.AI },
  { terms: ['backup', 'export', 'data', 'storage', 'cache', 'sync', 'wifi'], section: SETTINGS_SECTIONS.DATA },
  { terms: ['rsvp', 'meal', 'plus one', 'home', 'countdown', 'packing', 'wedding default'], section: SETTINGS_SECTIONS.WEDDING_DEFAULTS },
  { terms: ['about', 'version', 'licence', 'license', 'support', 'privacy policy', 'terms'], section: SETTINGS_SECTIONS.ABOUT },
];

export function searchSettingsSections(query) {
  const q = String(query || '')
    .trim()
    .toLowerCase();
  if (!q) return SETTINGS_HUB_LINKS;
  const matched = new Set();
  for (const entry of SETTINGS_SEARCH_INDEX) {
    if (entry.terms.some((t) => t.includes(q) || q.includes(t))) {
      matched.add(entry.section);
    }
  }
  // also match titles/subtitles
  for (const link of SETTINGS_HUB_LINKS) {
    if (
      link.title.toLowerCase().includes(q) ||
      link.subtitle.toLowerCase().includes(q)
    ) {
      matched.add(link.id);
    }
  }
  return SETTINGS_HUB_LINKS.filter((l) => matched.has(l.id));
}
