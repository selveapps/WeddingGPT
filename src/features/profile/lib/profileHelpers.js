/**
 * Pure helpers for the Profile screen.
 *
 * Nothing here touches React or the store. That keeps completeness scoring,
 * patch building and display formatting easy to reason about - and means a
 * future unit test can cover the maths without mounting a screen.
 */

import { coupleDisplayName, hasExactDate, WEDDING_STYLES } from '@/models';
import { daysUntil, formatLongDate, formatMonthYear } from '@/lib/date';
import { formatMoney } from '@/lib/currency';
import {
  PROFILE_COMPLETENESS_FIELDS,
  PROFILE_COPY,
  PLANNING_STAGE_OPTIONS,
  CEREMONY_OPTIONS,
  DATE_TYPE_OPTIONS,
  EMPTY_PROFILE_VALUES,
} from './profileConstants';

/**
 * Pull a flat form-shaped object out of the three workspace entities.
 * Missing entities produce empty strings / defaults rather than throwing, so
 * the screen can still render during first launch before onboarding finishes.
 */
export function valuesFromWorkspace({ user, couple, wedding } = {}) {
  if (!wedding && !user && !couple) {
    return { ...EMPTY_PROFILE_VALUES };
  }

  return {
    ownerName: wedding?.ownerName ?? user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    partnerName: wedding?.partnerName ?? couple?.partnerName ?? '',
    partnerEmail: couple?.partnerEmail ?? '',
    collaborationEnabled: Boolean(couple?.collaborationEnabled),
    date: wedding?.date ?? null,
    dateType: wedding?.dateType ?? EMPTY_PROFILE_VALUES.dateType,
    city: wedding?.city ?? '',
    region: wedding?.region ?? '',
    country: wedding?.country ?? '',
    venueName: wedding?.venueName ?? '',
    guestCountEstimate:
      wedding?.guestCountEstimate === undefined || wedding?.guestCountEstimate === null
        ? null
        : Number(wedding.guestCountEstimate),
    budgetTotal:
      wedding?.budgetTotal === undefined || wedding?.budgetTotal === null
        ? null
        : Number(wedding.budgetTotal),
    currency: wedding?.currency ?? EMPTY_PROFILE_VALUES.currency,
    planningStage: wedding?.planningStage ?? EMPTY_PROFILE_VALUES.planningStage,
    ceremonyType: wedding?.ceremonyType ?? EMPTY_PROFILE_VALUES.ceremonyType,
    styleTags: Array.isArray(wedding?.styleTags) ? [...wedding.styleTags] : [],
    stressors: Array.isArray(wedding?.stressors) ? [...wedding.stressors] : [],
  };
}

/** Deep-enough equality for the profile form's scalar + array fields. */
export function areProfileValuesEqual(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;

  const keys = Object.keys(EMPTY_PROFILE_VALUES);
  for (const key of keys) {
    const left = a[key];
    const right = b[key];

    if (Array.isArray(left) || Array.isArray(right)) {
      const leftList = Array.isArray(left) ? left : [];
      const rightList = Array.isArray(right) ? right : [];
      if (leftList.length !== rightList.length) return false;
      for (let i = 0; i < leftList.length; i += 1) {
        if (leftList[i] !== rightList[i]) return false;
      }
      continue;
    }

    if (left !== right) return false;
  }

  return true;
}

/**
 * Score how filled-in the profile is, as a 0–100 percentage and a list of
 * missing pieces the UI can surface as gentle prompts.
 */
export function calculateProfileCompleteness(values) {
  let earned = 0;
  let possible = 0;
  const missing = [];

  for (const field of PROFILE_COMPLETENESS_FIELDS) {
    possible += field.weight;
    const filled = isProfileFieldFilled(values, field.key);
    if (filled) {
      earned += field.weight;
    } else {
      missing.push({ key: field.key, label: field.label, section: field.section });
    }
  }

  const percent = possible === 0 ? 0 : Math.round((earned / possible) * 100);
  return {
    percent,
    earned,
    possible,
    missing,
    filledCount: PROFILE_COMPLETENESS_FIELDS.length - missing.length,
    totalCount: PROFILE_COMPLETENESS_FIELDS.length,
  };
}

export function isProfileFieldFilled(values, key) {
  const value = values?.[key];

  if (key === 'ceremonyType') {
    return Boolean(value) && value !== EMPTY_PROFILE_VALUES.ceremonyType;
  }
  if (key === 'planningStage') {
    return Boolean(value);
  }
  if (key === 'styleTags' || key === 'stressors') {
    return Array.isArray(value) && value.length > 0;
  }
  if (key === 'budgetTotal' || key === 'guestCountEstimate') {
    return value !== null && value !== undefined && value !== '' && Number(value) > 0;
  }
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined && value !== '';
}

/**
 * Split form values into the three patches the wedding store expects.
 * Empty optional contact strings become `null` so "no email" is one value
 * everywhere rather than `""` in some places and `null` in others.
 */
export function buildWorkspacePatches(values) {
  const ownerName = String(values.ownerName ?? '').trim();
  const partnerName = String(values.partnerName ?? '').trim();
  const email = String(values.email ?? '').trim() || null;
  const phone = String(values.phone ?? '').trim() || null;
  const partnerEmail = String(values.partnerEmail ?? '').trim() || null;
  const city = String(values.city ?? '').trim();
  const region = String(values.region ?? '').trim();
  const country = String(values.country ?? '').trim();
  const venueName = String(values.venueName ?? '').trim() || null;

  const guestRaw = values.guestCountEstimate;
  const guestCountEstimate =
    guestRaw === null || guestRaw === undefined || guestRaw === ''
      ? null
      : Number(guestRaw);

  const budgetRaw = values.budgetTotal;
  const budgetTotal =
    budgetRaw === null || budgetRaw === undefined || budgetRaw === ''
      ? null
      : Number(budgetRaw);

  return {
    user: {
      name: ownerName,
      email,
      phone,
    },
    couple: {
      partnerName,
      partnerEmail,
      collaborationEnabled: Boolean(values.collaborationEnabled),
    },
    wedding: {
      ownerName,
      partnerName,
      date: values.date ?? null,
      dateType: values.dateType,
      city,
      region,
      country,
      venueName,
      guestCountEstimate: Number.isFinite(guestCountEstimate) ? guestCountEstimate : null,
      budgetTotal: Number.isFinite(budgetTotal) ? budgetTotal : null,
      currency: values.currency,
      planningStage: values.planningStage,
      ceremonyType: values.ceremonyType,
      styleTags: Array.isArray(values.styleTags) ? [...values.styleTags] : [],
      stressors: Array.isArray(values.stressors) ? [...values.stressors] : [],
    },
  };
}

/** Toggle a value in a multi-select list, returning a new array. */
export function toggleListValue(list, value, { exclusiveWith = [] } = {}) {
  const current = Array.isArray(list) ? list : [];
  const has = current.includes(value);
  let next = has ? current.filter((item) => item !== value) : [...current, value];

  if (!has && exclusiveWith.length > 0) {
    next = next.filter((item) => !exclusiveWith.includes(item) || item === value);
  }

  return next;
}

export function labelForCeremony(value) {
  return CEREMONY_OPTIONS.find((option) => option.value === value)?.label ?? 'Still deciding';
}

export function labelForPlanningStage(value) {
  return PLANNING_STAGE_OPTIONS.find((option) => option.value === value)?.label ?? 'Just engaged';
}

export function labelForDateType(value) {
  return DATE_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? 'Not sure';
}

export function labelsForStyles(keys) {
  if (!Array.isArray(keys) || keys.length === 0) return [];
  return keys
    .map((key) => WEDDING_STYLES.find((style) => style.key === key)?.name ?? key)
    .filter(Boolean);
}

/**
 * Human-readable wedding date line for the hero and summary card.
 * Exact dates get a full date; approximate ones stay intentionally soft.
 */
export function formatWeddingDateLine(values) {
  if (!values?.date) {
    return values?.dateType && values.dateType !== 'undecided'
      ? labelForDateType(values.dateType)
      : 'Date not set yet';
  }

  if (hasExactDate({ date: values.date, dateType: values.dateType })) {
    return formatLongDate(values.date);
  }

  return formatMonthYear(values.date) || formatLongDate(values.date);
}

export function formatCountdownLine(values) {
  if (!values?.date) return null;
  const days = daysUntil(values.date);
  if (days === null) return null;
  if (days === 0) return 'That is today';
  if (days === 1) return 'Tomorrow';
  if (days > 1) return `${days} days to go`;
  if (days === -1) return 'Yesterday';
  return `${Math.abs(days)} days ago`;
}

export function formatLocationLine(values) {
  const parts = [values?.city, values?.region, values?.country]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean);
  if (parts.length === 0) return 'Location not set yet';
  return parts.join(', ');
}

export function formatBudgetLine(values) {
  if (values?.budgetTotal == null) return 'Budget not set yet';
  return formatMoney(values.budgetTotal, values.currency);
}

export function formatGuestLine(values) {
  if (values?.guestCountEstimate == null) return 'Guest count not set yet';
  const n = Number(values.guestCountEstimate);
  if (!Number.isFinite(n)) return 'Guest count not set yet';
  return `About ${n} ${n === 1 ? 'guest' : 'guests'}`;
}

export function displayCoupleName(values) {
  return coupleDisplayName({
    ownerName: values?.ownerName,
    partnerName: values?.partnerName,
  });
}

export function heroSubtitle(values) {
  const location = formatLocationLine(values);
  const date = formatWeddingDateLine(values);
  if (location === 'Location not set yet' && date === 'Date not set yet') {
    return PROFILE_COPY.screenSubtitle;
  }
  if (location === 'Location not set yet') return date;
  if (date === 'Date not set yet') return location;
  return `${date} · ${location}`;
}

/**
 * Build short summary rows for the read-only card above the form.
 * Empty values still appear, so the couple can see what is missing at a glance.
 */
export function buildSummaryRows(values) {
  return [
    {
      id: 'names',
      icon: 'heart',
      title: 'Couple',
      value: displayCoupleName(values),
    },
    {
      id: 'date',
      icon: 'calendar',
      title: 'Date',
      value: formatWeddingDateLine(values),
      meta: formatCountdownLine(values) ?? undefined,
    },
    {
      id: 'location',
      icon: 'location',
      title: 'Place',
      value: formatLocationLine(values),
    },
    {
      id: 'guests',
      icon: 'guests',
      title: 'Guests',
      value: formatGuestLine(values),
    },
    {
      id: 'budget',
      icon: 'budget',
      title: 'Budget',
      value: formatBudgetLine(values),
    },
    {
      id: 'stage',
      icon: 'checklist',
      title: 'Stage',
      value: labelForPlanningStage(values.planningStage),
    },
    {
      id: 'ceremony',
      icon: 'sparkle',
      title: 'Celebration',
      value: labelForCeremony(values.ceremonyType),
    },
    {
      id: 'style',
      icon: 'heart',
      title: 'Style',
      value: (() => {
        const labels = labelsForStyles(values.styleTags);
        if (labels.length === 0) return 'Not chosen yet';
        if (labels.length === 1) return labels[0];
        if (labels.length === 2) return labels.join(' and ');
        return `${labels.slice(0, 2).join(', ')} +${labels.length - 2}`;
      })(),
    },
  ];
}

/**
 * Completeness tone for badges and progress rings.
 * Keeps colour decisions out of the components.
 */
export function completenessTone(percent) {
  if (percent >= 90) return 'success';
  if (percent >= 60) return 'brand';
  if (percent >= 30) return 'warning';
  return 'neutral';
}

/** Normalise a guest-count text field into a number or null. */
export function parseGuestCountInput(text) {
  if (text == null || String(text).trim() === '') return null;
  const digits = String(text).replace(/[^\d]/g, '');
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
}

/** Which completeness field / form section each snapshot row maps to. */
const SNAPSHOT_ROW_LINKS = {
  date: { field: 'date', section: 'wedding' },
  location: { field: 'city', section: 'wedding' },
  guests: { field: 'guestCountEstimate', section: 'wedding' },
  budget: { field: 'budgetTotal', section: 'wedding' },
  stage: { field: 'planningStage', section: 'wedding' },
  ceremony: { field: 'ceremonyType', section: 'wedding' },
  style: { field: 'styleTags', section: 'vision' },
};

/**
 * Snapshot tiles for the at-a-glance grid.
 * Same data as `buildSummaryRows`, minus the couple row (the hero already shows
 * the names), plus an `empty` flag and the section to open when tapped.
 */
export function buildSnapshotTiles(values) {
  return buildSummaryRows(values)
    .filter((row) => row.id !== 'names')
    .map((row) => {
      const link = SNAPSHOT_ROW_LINKS[row.id];
      return {
        ...row,
        section: link?.section ?? null,
        empty: link ? !isProfileFieldFilled(values, link.field) : false,
      };
    });
}

