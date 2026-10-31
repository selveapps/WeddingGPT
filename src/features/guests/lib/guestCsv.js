import {
  INVITATION_STATUS_META,
  InvitationStatus,
  MEAL_PREFERENCE_META,
  MealPreference,
  PLUS_ONE_STATUS_META,
  PlusOneStatus,
  RSVP_STATUS_META,
  RsvpStatus,
  guestFullName,
} from '@/models';
import { parseCsv, toCsv, unguardCell } from '@/lib/csv';
import { rules } from '@/lib/validation';

/**
 * Guest list import and export as CSV.
 *
 * Export writes readable labels ("Attending", "Vegetarian"), so the file works
 * for a caterer or planner as-is. Import accepts those labels back, plus the
 * words people actually type in a spreadsheet ("yes", "veg", "no thanks"), and
 * guesses which column is which from the header row.
 */

// --- Fields ----------------------------------------------------------------------

/** Every field a column can be mapped to, in the order the mapping screen shows them. */
export const GuestField = {
  FIRST_NAME: 'firstName',
  LAST_NAME: 'lastName',
  FULL_NAME: 'fullName',
  HOUSEHOLD: 'household',
  EMAIL: 'email',
  PHONE: 'phone',
  RSVP: 'rsvpStatus',
  MEAL: 'mealPreference',
  DIETARY: 'dietaryNotes',
  PLUS_ONE: 'plusOneStatus',
  PLUS_ONE_NAME: 'plusOneName',
  CHILD: 'isChild',
  INVITATION: 'invitationStatus',
  TAGS: 'tags',
  NOTES: 'notes',
  IGNORE: 'ignore',
};

export const GUEST_FIELD_META = {
  [GuestField.FIRST_NAME]: { label: 'First name' },
  [GuestField.LAST_NAME]: { label: 'Last name' },
  [GuestField.FULL_NAME]: { label: 'Full name' },
  [GuestField.HOUSEHOLD]: { label: 'Household' },
  [GuestField.EMAIL]: { label: 'Email' },
  [GuestField.PHONE]: { label: 'Phone' },
  [GuestField.RSVP]: { label: 'RSVP' },
  [GuestField.MEAL]: { label: 'Meal' },
  [GuestField.DIETARY]: { label: 'Dietary notes' },
  [GuestField.PLUS_ONE]: { label: 'Plus one' },
  [GuestField.PLUS_ONE_NAME]: { label: 'Plus-one name' },
  [GuestField.CHILD]: { label: 'Child' },
  [GuestField.INVITATION]: { label: 'Invitation' },
  [GuestField.TAGS]: { label: 'Tags' },
  [GuestField.NOTES]: { label: 'Notes' },
  [GuestField.IGNORE]: { label: "Don't import" },
};

/** Header words that identify each field, matched after lower-casing and stripping punctuation. */
const HEADER_SYNONYMS = {
  [GuestField.FIRST_NAME]: ['first name', 'firstname', 'first', 'given name', 'forename'],
  [GuestField.LAST_NAME]: ['last name', 'lastname', 'last', 'surname', 'family name'],
  [GuestField.FULL_NAME]: ['name', 'full name', 'guest', 'guest name', 'display name'],
  [GuestField.HOUSEHOLD]: ['household', 'family', 'party', 'group', 'invite group', 'household name'],
  [GuestField.EMAIL]: ['email', 'e mail', 'email address', 'mail'],
  [GuestField.PHONE]: ['phone', 'mobile', 'cell', 'phone number', 'telephone', 'tel'],
  [GuestField.RSVP]: ['rsvp', 'attending', 'attendance', 'response', 'coming', 'reply'],
  [GuestField.MEAL]: ['meal', 'meal choice', 'menu', 'entree', 'food', 'meal preference'],
  [GuestField.DIETARY]: [
    'dietary',
    'dietary notes',
    'diet',
    'allergies',
    'dietary requirements',
    'restrictions',
  ],
  [GuestField.PLUS_ONE]: ['plus one', 'plus 1', '+1', 'guest allowed'],
  [GuestField.PLUS_ONE_NAME]: ['plus one name', 'plus 1 name', '+1 name', 'partner name'],
  [GuestField.CHILD]: ['child', 'kid', 'is child', 'children'],
  [GuestField.INVITATION]: ['invitation', 'invite', 'invitation status', 'invited'],
  [GuestField.TAGS]: ['tags', 'tag', 'labels', 'side', 'category'],
  [GuestField.NOTES]: ['notes', 'note', 'comments', 'comment'],
};

const normaliseHeader = (header) =>
  String(header ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9+]+/g, ' ')
    .trim();

/**
 * Guess a field for each column from the header row. Each field is used at
 * most once; anything unrecognised is ignored. If both first/last and a full
 * name column exist, the split columns win.
 */
export function guessMapping(headers = []) {
  const used = new Set();
  const mapping = headers.map((header) => {
    const words = normaliseHeader(header);
    const field = Object.entries(HEADER_SYNONYMS).find(
      ([candidate, synonyms]) => !used.has(candidate) && synonyms.includes(words)
    )?.[0];
    if (!field) return GuestField.IGNORE;
    used.add(field);
    return field;
  });

  if (used.has(GuestField.FIRST_NAME) && used.has(GuestField.FULL_NAME)) {
    return mapping.map((field) => (field === GuestField.FULL_NAME ? GuestField.IGNORE : field));
  }
  return mapping;
}

/** A mapping can import only if some column provides a name. */
export function mappingHasName(mapping = []) {
  return mapping.includes(GuestField.FIRST_NAME) || mapping.includes(GuestField.FULL_NAME);
}

// --- Value parsing -------------------------------------------------------------------

const word = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase();

const RSVP_WORDS = {
  [RsvpStatus.ATTENDING]: [
    'attending',
    'yes',
    'y',
    'accepted',
    'accept',
    'coming',
    'going',
    'confirmed',
    'true',
    '1',
  ],
  [RsvpStatus.DECLINED]: ['declined', 'no', 'n', 'decline', 'not coming', 'regrets', 'false', '0'],
  [RsvpStatus.MAYBE]: ['maybe', 'tentative', 'unsure', 'possibly'],
  [RsvpStatus.NO_RESPONSE]: ['no response', 'no reply'],
  [RsvpStatus.PENDING]: ['awaiting reply', 'pending', 'awaiting', 'waiting', 'invited', ''],
};

const MEAL_WORDS = {
  [MealPreference.STANDARD]: ['standard', 'regular', 'meat', 'chicken', 'beef', 'fish', 'any'],
  [MealPreference.VEGETARIAN]: ['vegetarian', 'veg', 'veggie'],
  [MealPreference.VEGAN]: ['vegan', 'plant based'],
  [MealPreference.JAIN]: ['jain'],
  [MealPreference.HALAL]: ['halal'],
  [MealPreference.KOSHER]: ['kosher'],
  [MealPreference.GLUTEN_FREE]: ['gluten free', 'gluten-free', 'gf', 'coeliac', 'celiac'],
  [MealPreference.CHILD]: ["children's meal", 'childrens meal', 'child', 'kids', 'kids meal'],
  [MealPreference.UNSPECIFIED]: ['not specified', 'unspecified', 'none', ''],
};

const findByWords = (table, value) => {
  const needle = word(value);
  return Object.entries(table).find(([, words]) => words.includes(needle))?.[0] ?? null;
};

/** `{ value }` for a recognised word, or `{ error }` naming what was not understood. */
export function parseRsvp(value) {
  const found = findByWords(RSVP_WORDS, value);
  return found ? { value: found } : { error: `RSVP "${String(value).trim()}" not recognised` };
}

/** Unknown meals are kept as "Other" with the original word in dietary notes. */
export function parseMeal(value) {
  const found = findByWords(MEAL_WORDS, value);
  return found ? { value: found } : { value: MealPreference.OTHER, note: String(value).trim() };
}

export function parseYesNo(value) {
  return ['yes', 'y', 'true', '1', 'x', 'allowed', 'confirmed'].includes(word(value));
}

export function parsePlusOne(value) {
  const text = word(value);
  const label = Object.entries(PLUS_ONE_STATUS_META).find(
    ([, meta]) => meta.label.toLowerCase() === text
  )?.[0];
  if (label) return label;
  if (['confirmed', 'bringing', 'yes confirmed'].includes(text)) return PlusOneStatus.CONFIRMED;
  return parseYesNo(value) ? PlusOneStatus.ALLOWED : PlusOneStatus.NOT_ALLOWED;
}

export function parseInvitation(value) {
  const text = word(value);
  const label = Object.entries(INVITATION_STATUS_META).find(
    ([, meta]) => meta.label.toLowerCase() === text
  )?.[0];
  if (label) return label;
  if (['yes', 'sent', 'invited', 'y', 'true'].includes(text)) return InvitationStatus.INVITED;
  if (['save the date', 'std'].includes(text)) return InvitationStatus.SAVE_THE_DATE_SENT;
  return InvitationStatus.NOT_SENT;
}

export function parseTags(value) {
  return String(value ?? '')
    .split(/[;|,]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

/**
 * "Meera Shah" -> "Meera" / "Shah". The last word is the last name, so
 * multi-word surnames ("de la Cruz") need separate first and last columns.
 */
export function splitFullName(fullName) {
  const parts = String(fullName ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] ?? '', lastName: '' };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] };
}

// --- Import ------------------------------------------------------------------------

const emailRule = rules.email();
const phoneRule = rules.phone();

const identityKey = (guest) => {
  if (guest.email) return `email:${guest.email.trim().toLowerCase()}`;
  return `name:${guestFullName(guest).toLowerCase()}`;
};

/**
 * Turn parsed rows into guest drafts the couple can preview.
 *
 * Returns `{ rows }`, one per data row, each `{ line, status, draft, household,
 * errors }` where status is `ready`, `duplicate` (already on the list, or
 * earlier in the file) or `error`. Nothing is written - see `importDrafts`.
 */
export function buildImportPreview(rows, mapping, { existingGuests = [], hasHeader = true } = {}) {
  const dataRows = hasHeader ? rows.slice(1) : rows;
  const seen = new Set(existingGuests.map(identityKey));
  const firstLine = hasHeader ? 2 : 1;

  return {
    rows: dataRows.map((cells, index) => {
      const draft = {
        firstName: '',
        lastName: '',
        email: null,
        phone: null,
        rsvpStatus: RsvpStatus.PENDING,
        mealPreference: MealPreference.UNSPECIFIED,
        dietaryNotes: '',
        plusOneStatus: PlusOneStatus.NOT_ALLOWED,
        plusOneName: '',
        isChild: false,
        invitationStatus: InvitationStatus.NOT_SENT,
        tags: [],
        notes: '',
      };
      let household = '';
      const errors = [];
      const extraNotes = [];

      mapping.forEach((field, column) => {
        const raw = unguardCell(String(cells[column] ?? '').trim());
        if (field === GuestField.IGNORE) return;
        switch (field) {
          case GuestField.FIRST_NAME:
          case GuestField.LAST_NAME:
          case GuestField.DIETARY:
          case GuestField.PLUS_ONE_NAME:
          case GuestField.NOTES:
            draft[field] = raw;
            break;
          case GuestField.FULL_NAME:
            if (raw && !draft.firstName) Object.assign(draft, splitFullName(raw));
            break;
          case GuestField.HOUSEHOLD:
            household = raw;
            break;
          case GuestField.EMAIL:
            if (raw && emailRule(raw)) errors.push(`Email "${raw}" looks incomplete`);
            else draft.email = raw || null;
            break;
          case GuestField.PHONE:
            if (raw && phoneRule(raw)) errors.push(`Phone "${raw}" looks incomplete`);
            else draft.phone = raw || null;
            break;
          case GuestField.RSVP: {
            const result = parseRsvp(raw);
            if (result.error) errors.push(result.error);
            else draft.rsvpStatus = result.value;
            break;
          }
          case GuestField.MEAL: {
            const result = parseMeal(raw);
            draft.mealPreference = result.value;
            if (result.note) extraNotes.push(`Meal: ${result.note}`);
            break;
          }
          case GuestField.PLUS_ONE:
            draft.plusOneStatus = parsePlusOne(raw);
            break;
          case GuestField.CHILD:
            draft.isChild = parseYesNo(raw);
            break;
          case GuestField.INVITATION:
            draft.invitationStatus = parseInvitation(raw);
            break;
          case GuestField.TAGS:
            draft.tags = parseTags(raw);
            break;
          default:
            break;
        }
      });

      if (extraNotes.length) {
        draft.dietaryNotes = [draft.dietaryNotes, ...extraNotes].filter(Boolean).join('; ');
      }
      if (draft.plusOneName && draft.plusOneStatus === PlusOneStatus.NOT_ALLOWED) {
        draft.plusOneStatus = PlusOneStatus.CONFIRMED;
      }
      if (!draft.firstName && !draft.lastName) errors.unshift('No name');

      let status = errors.length ? 'error' : 'ready';
      if (status === 'ready') {
        const key = identityKey(draft);
        if (seen.has(key)) status = 'duplicate';
        else seen.add(key);
      }

      return { line: firstLine + index, status, draft, household, errors };
    }),
  };
}

export function summariseImportPreview(preview) {
  const counts = { ready: 0, duplicate: 0, error: 0 };
  for (const row of preview.rows) counts[row.status] += 1;
  const households = new Set(
    preview.rows
      .filter((row) => row.status === 'ready' && row.household)
      .map((row) => row.household.toLowerCase())
  );
  return { ...counts, total: preview.rows.length, households: households.size };
}

/**
 * Write the ready rows: reuse households by name (case-insensitive), create
 * the missing ones, then add every guest in one store update.
 */
export function importDrafts(preview, { weddingId, households = [], addHousehold, addGuests }) {
  const householdIdByName = new Map(
    households.map((household) => [household.name.trim().toLowerCase(), household.id])
  );
  const ready = preview.rows.filter((row) => row.status === 'ready');

  const inputs = ready.map(({ draft, household }) => {
    let householdId = null;
    const name = household.trim();
    if (name) {
      const key = name.toLowerCase();
      if (!householdIdByName.has(key)) householdIdByName.set(key, addHousehold({ weddingId, name }).id);
      householdId = householdIdByName.get(key);
    }
    return { ...draft, weddingId, householdId };
  });

  return addGuests(inputs);
}

// --- Export ------------------------------------------------------------------------

export const EXPORT_COLUMNS = [
  GuestField.FIRST_NAME,
  GuestField.LAST_NAME,
  GuestField.HOUSEHOLD,
  GuestField.EMAIL,
  GuestField.PHONE,
  GuestField.RSVP,
  GuestField.MEAL,
  GuestField.DIETARY,
  GuestField.PLUS_ONE,
  GuestField.PLUS_ONE_NAME,
  GuestField.CHILD,
  GuestField.INVITATION,
  GuestField.TAGS,
  GuestField.NOTES,
];

function exportValue(field, guest, householdName) {
  switch (field) {
    case GuestField.HOUSEHOLD:
      return householdName ?? '';
    case GuestField.RSVP:
      return RSVP_STATUS_META[guest.rsvpStatus]?.label ?? '';
    case GuestField.MEAL:
      return guest.mealPreference === MealPreference.UNSPECIFIED
        ? ''
        : (MEAL_PREFERENCE_META[guest.mealPreference]?.label ?? '');
    case GuestField.PLUS_ONE:
      return PLUS_ONE_STATUS_META[guest.plusOneStatus]?.label ?? '';
    case GuestField.CHILD:
      return guest.isChild ? 'Yes' : '';
    case GuestField.INVITATION:
      return INVITATION_STATUS_META[guest.invitationStatus]?.label ?? '';
    case GuestField.TAGS:
      return (guest.tags ?? []).join('; ');
    default:
      return guest[field] ?? '';
  }
}

/** The whole guest list as CSV, sorted by household then name. */
export function guestsToCsv(guests = [], households = []) {
  const nameById = new Map(households.map((household) => [household.id, household.name]));
  const sorted = [...guests].sort(
    (a, b) =>
      (nameById.get(a.householdId) ?? '￿').localeCompare(nameById.get(b.householdId) ?? '￿') ||
      guestFullName(a).localeCompare(guestFullName(b))
  );
  const header = EXPORT_COLUMNS.map((field) => GUEST_FIELD_META[field].label);
  const rows = sorted.map((guest) =>
    EXPORT_COLUMNS.map((field) => exportValue(field, guest, nameById.get(guest.householdId)))
  );
  return toCsv([header, ...rows]);
}

/** Parse pasted or uploaded text and guess the mapping in one step. */
export function readGuestCsv(text) {
  const rows = parseCsv(text);
  const headers = rows[0] ?? [];
  return { rows, headers, mapping: guessMapping(headers) };
}
