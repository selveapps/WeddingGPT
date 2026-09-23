/**
 * StorageService - the contract every persistence backend must satisfy.
 *
 * Nothing above this line knows whether data lives in AsyncStorage, SQLite, or
 * a remote API. Stores and repositories depend on this shape only, which is
 * what lets the PRD's "replace local persistence with a backend without
 * rewriting the UI" requirement (s.24) actually hold.
 *
 * Contract notes:
 *  - Values are plain JSON-serialisable data. The adapter owns serialisation.
 *  - `get` resolves to `null` for a missing key - never throws, never undefined.
 *  - Writes resolve once durable. Callers may fire-and-forget, but a rejected
 *    promise means the write did NOT happen and must be surfaced.
 *  - Keys are namespaced by the adapter; callers pass bare logical keys.
 *
 * @typedef {Object} StorageService
 * @property {(key: string) => Promise<any|null>} get
 * @property {(key: string, value: any) => Promise<void>} set
 * @property {(key: string) => Promise<void>} remove
 * @property {(keys: string[]) => Promise<Record<string, any|null>>} getMany
 * @property {(entries: Array<[string, any]>) => Promise<void>} setMany
 * @property {(keys: string[]) => Promise<void>} removeMany
 * @property {() => Promise<string[]>} keys
 * @property {() => Promise<void>} clear
 */

/**
 * Keys used by the app. Centralised so there is exactly one place to audit what
 * is persisted, and so a typo cannot silently orphan a user's data.
 */
export const StorageKeys = {
  SCHEMA_VERSION: 'schema:version',

  ONBOARDING_DRAFT: 'onboarding:draft',
  ONBOARDING_STATUS: 'onboarding:status',

  WEDDING: 'wedding:current',
  USER: 'user:current',
  COUPLE: 'couple:current',

  TASKS: 'planning:tasks',
  TASK_CATEGORIES: 'planning:categories',

  BUDGET: 'budget:summary',
  BUDGET_CATEGORIES: 'budget:categories',
  EXPENSES: 'budget:expenses',

  GUESTS: 'guests:list',
  HOUSEHOLDS: 'guests:households',

  VENDORS: 'vendors:list',

  VISION_STYLE_PROFILE: 'vision:styleProfile',
  VISION_INSPIRATION: 'vision:inspiration',
  VISION_MOODBOARDS: 'vision:moodboards',

  AI_CONVERSATIONS: 'ai:conversations',
  AI_MESSAGES: 'ai:messages',
  AI_USAGE: 'ai:usage',

  SUBSCRIPTION: 'subscription:entitlement',
  PREFERENCES: 'prefs:user',
  NOTIFICATIONS: 'prefs:notifications',
  ANALYTICS_QUEUE: 'analytics:queue',
};

/** Current on-device schema version. Bump when a migration is added. */
export const SCHEMA_VERSION = 1;
