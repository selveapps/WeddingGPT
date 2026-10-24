/**
 * Pure model helpers for the Wedding Day Emergency Plan.
 *
 * This module intentionally has no React Native or storage dependency so its
 * validation and progress calculations can be tested in a plain Jest test.
 */

export const EMERGENCY_PLAN_LIMITS = Object.freeze({
  maxItems: 80,
  titleLength: 120,
  ownerLength: 80,
});

export const DEFAULT_EMERGENCY_ITEMS = Object.freeze([
  { title: 'Confirm all vendors have the venue address and arrival time', owner: 'Wedding coordinator' },
  { title: 'Keep vendor phone numbers and booking confirmations accessible', owner: 'Point person' },
  { title: 'Pack a small first-aid kit and basic medication', owner: 'Family helper' },
  { title: 'Prepare a sewing kit, safety pins, tape, and stain remover', owner: 'Wedding party' },
  { title: 'Keep water and quick snacks available for the couple', owner: 'Family helper' },
  { title: 'Confirm transport and a backup ride', owner: 'Transport contact' },
  { title: 'Choose one person to handle guest questions', owner: 'Usher' },
  { title: 'Set aside copies of important documents and payment receipts', owner: 'Couple' },
  { title: 'Confirm rain / heat / power contingency with the venue', owner: 'Venue contact' },
  { title: 'Pack phone chargers and a power bank', owner: 'Wedding party' },
  { title: 'Label envelopes, gifts, and personal belongings', owner: 'Family helper' },
  { title: 'Agree who keeps rings and other valuables before the ceremony', owner: 'Trusted person' },
]);

function safeText(value, maxLength) {
  return String(value ?? '').trim().slice(0, maxLength);
}

function createId() {
  return `emergency-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Create a valid item. IDs are generated here so UI code cannot accidentally
 * create a checklist row without a stable key.
 */
export function createEmergencyItem(input = {}) {
  return {
    id: safeText(input.id, 100) || createId(),
    title: safeText(input.title, EMERGENCY_PLAN_LIMITS.titleLength) || 'Untitled task',
    owner: safeText(input.owner, EMERGENCY_PLAN_LIMITS.ownerLength),
    done: Boolean(input.done),
    custom: input.custom !== false,
    createdAt: safeText(input.createdAt, 40) || new Date().toISOString(),
  };
}

/** Create the suggested plan used on first open. */
export function createDefaultEmergencyPlan() {
  return {
    version: 1,
    items: DEFAULT_EMERGENCY_ITEMS.map((item) => createEmergencyItem({ ...item, custom: false })),
    venue: '',
    primaryContact: '',
    backupContact: '',
    notes: '',
    updatedAt: null,
  };
}

/**
 * Normalize persisted JSON defensively. Invalid rows are discarded, duplicate
 * IDs are regenerated, text is bounded, and a missing items array is replaced
 * with the suggested defaults.
 */
export function normaliseEmergencyPlan(value) {
  const source = value && typeof value === 'object' ? value : {};
  const rawItems = Array.isArray(source.items) ? source.items : null;
  const items = (rawItems ?? createDefaultEmergencyPlan().items)
    .slice(0, EMERGENCY_PLAN_LIMITS.maxItems)
    .filter((item) => item && typeof item === 'object')
    .map((item) => createEmergencyItem(item));

  const seen = new Set();
  const uniqueItems = items.map((item) => {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      return item;
    }
    const replacement = createEmergencyItem({ ...item, id: '' });
    seen.add(replacement.id);
    return replacement;
  });

  return {
    version: 1,
    items: uniqueItems,
    venue: safeText(source.venue, 240),
    primaryContact: safeText(source.primaryContact, 160),
    backupContact: safeText(source.backupContact, 160),
    notes: String(source.notes ?? '').slice(0, 4000),
    updatedAt: safeText(source.updatedAt, 40) || null,
  };
}

/** Toggle an item without mutating the original array. Unknown IDs are ignored. */
export function toggleEmergencyItem(items, id) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => (item.id === id ? { ...item, done: !item.done } : item));
}

/** Summarise completion; an empty list is 0% rather than NaN. */
export function getEmergencyProgress(items) {
  const list = Array.isArray(items) ? items : [];
  const total = list.length;
  const done = list.filter((item) => item?.done).length;
  return {
    total,
    done,
    remaining: total - done,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
  };
}

/** Restore missing suggested tasks without replacing custom items or completion. */
export function appendMissingDefaults(items) {
  const current = Array.isArray(items) ? items : [];
  const existingTitles = new Set(current.map((item) => safeText(item?.title, 200).toLowerCase()));
  const missing = DEFAULT_EMERGENCY_ITEMS
    .filter((item) => !existingTitles.has(item.title.toLowerCase()))
    .map((item) => createEmergencyItem({ ...item, custom: false }));
  return [...current, ...missing].slice(0, EMERGENCY_PLAN_LIMITS.maxItems);
}

/** Produce plain text that can be shared with a coordinator or trusted helper. */
export function formatEmergencyPlanForSharing(plan) {
  const safePlan = normaliseEmergencyPlan(plan);
  const progress = getEmergencyProgress(safePlan.items);
  return [
    'WEDDING DAY EMERGENCY PLAN',
    `Venue: ${safePlan.venue || 'Not added'}`,
    `Primary contact: ${safePlan.primaryContact || 'Not added'}`,
    `Backup contact: ${safePlan.backupContact || 'Not added'}`,
    `Checklist: ${progress.done}/${progress.total} complete`,
    '',
    ...safePlan.items.map((item) => `${item.done ? '[x]' : '[ ]'} ${item.title}${item.owner ? ` — ${item.owner}` : ''}`),
    '',
    `Notes: ${safePlan.notes || 'None'}`,
  ].join('\n');
}
