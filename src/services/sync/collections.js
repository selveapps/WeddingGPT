import { useWeddingStore } from '../../store/weddingStore';
import { usePlanningStore } from '../../store/planningStore';
import { useBudgetStore } from '../../store/budgetStore';
import { useGuestStore } from '../../store/guestStore';
import { useVendorStore } from '../../store/vendorStore';
import { useRsvpStore } from '../../store/rsvpStore';
import { useWebsiteStore } from '../../store/websiteStore';
import { useSeatingStore } from '../../store/seatingStore';
import { SliceKind } from './changes';

/**
 * Which store slices sync, and as which server collection.
 *
 * Shared wedding data only. Left out on purpose:
 *  - reminder preferences: personal; one partner turning reminders off must
 *    not silence the other's phone
 *  - the user record (email, phone) and onboarding progress: per person
 *  - assistant conversations: private to whoever had them
 *  - today's checklist and seeding flags: per device
 *
 * `readOnly` slices are pulled but never pushed: guests' RSVP replies can only
 * be written by the server, from the guest's own link.
 */
export const SYNCED_SLICES = [
  { collection: 'wedding', store: useWeddingStore, key: 'wedding', kind: SliceKind.ONE },
  { collection: 'budget', store: useBudgetStore, key: 'budget', kind: SliceKind.ONE },
  { collection: 'tasks', store: usePlanningStore, key: 'tasks', kind: SliceKind.MANY },
  { collection: 'taskCategories', store: usePlanningStore, key: 'categories', kind: SliceKind.MANY },
  { collection: 'expenses', store: useBudgetStore, key: 'expenses', kind: SliceKind.MANY },
  { collection: 'budgetCategories', store: useBudgetStore, key: 'categories', kind: SliceKind.MANY },
  { collection: 'guests', store: useGuestStore, key: 'guests', kind: SliceKind.MANY },
  { collection: 'households', store: useGuestStore, key: 'households', kind: SliceKind.MANY },
  { collection: 'vendors', store: useVendorStore, key: 'vendors', kind: SliceKind.MANY },
  { collection: 'website', store: useWebsiteStore, key: 'website', kind: SliceKind.ONE },
  { collection: 'seatingTables', store: useSeatingStore, key: 'tables', kind: SliceKind.MANY },
  { collection: 'seatingRules', store: useSeatingStore, key: 'rules', kind: SliceKind.ONE },
  {
    collection: 'rsvpResponses',
    store: useRsvpStore,
    key: 'responses',
    kind: SliceKind.MANY,
    readOnly: true,
  },
];
