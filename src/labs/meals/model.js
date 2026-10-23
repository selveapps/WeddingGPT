import {
  RsvpStatus,
  PlusOneStatus,
  MealPreference,
  MEAL_PREFERENCE_META,
  guestFullName,
} from '@/models';

import { toCsv } from '@/lib/csv';

/**
 * Meals and dietary needs (Labs).
 *
 * Guests already carry `mealPreference` and free-text `dietaryNotes`; this
 * turns them into the report a caterer actually asks for. Only attending
 * guests count, and a confirmed plus-one is a real plate with a meal still to
 * be confirmed.
 *
 * Allergen detection is a keyword scan of the notes - a prompt to double-check
 * with the guest, not a medical record.
 */

export const ALLERGENS = [
  { key: 'nuts', label: 'Nuts', pattern: /\b(tree ?nuts?|nuts?|peanuts?|almonds?|cashews?|walnuts?|pecans?|hazelnuts?|pistachios?)\b/i },
  { key: 'shellfish', label: 'Shellfish', pattern: /\b(shellfish|shrimps?|prawns?|crabs?|lobsters?|oysters?|mussels?|clams?|scallops?)\b/i },
  { key: 'fish', label: 'Fish', pattern: /\bfish\b/i },
  { key: 'dairy', label: 'Dairy', pattern: /\b(dairy|lactose|milk|cheese|butter)\b/i },
  { key: 'gluten', label: 'Gluten', pattern: /\b(gluten|coeliac|celiac|wheat)\b/i },
  { key: 'egg', label: 'Egg', pattern: /\beggs?\b/i },
  { key: 'soy', label: 'Soy', pattern: /\b(soy|soya)\b/i },
  { key: 'sesame', label: 'Sesame', pattern: /\bsesame\b/i },
];

/** Notes that say a guest is fine with something should not flag it. */
const NEGATED = /\b(no|not|isn't|is not)\s+(an?\s+)?(issue|problem|allerg)/i;

export function detectAllergens(text) {
  if (!text || NEGATED.test(text)) return [];
  return ALLERGENS.filter((allergen) => allergen.pattern.test(text)).map((allergen) => allergen.key);
}

const mealLabel = (key) => MEAL_PREFERENCE_META[key]?.label ?? 'Not specified';

export function buildCateringReport(guests = []) {
  const attending = guests.filter((guest) => guest.rsvpStatus === RsvpStatus.ATTENDING);
  const meals = {};
  const allergens = {};
  const notes = [];
  const missingChoice = [];
  let children = 0;
  let plusOnes = 0;

  for (const guest of attending) {
    const name = guestFullName(guest) || 'Unnamed guest';
    const meal = guest.mealPreference ?? MealPreference.UNSPECIFIED;
    meals[meal] = (meals[meal] ?? 0) + 1;
    if (meal === MealPreference.UNSPECIFIED) missingChoice.push(guest);
    if (guest.isChild) children++;

    if (guest.plusOneStatus === PlusOneStatus.CONFIRMED) {
      plusOnes++;
      meals[MealPreference.UNSPECIFIED] = (meals[MealPreference.UNSPECIFIED] ?? 0) + 1;
    }

    const note = guest.dietaryNotes?.trim();
    if (note) {
      notes.push({ guestId: guest.id, name, note });
      for (const key of detectAllergens(note)) {
        if (!allergens[key]) allergens[key] = [];
        allergens[key].push(name);
      }
    }
  }

  const headcount = attending.length + plusOnes;

  return {
    headcount,
    adults: headcount - children,
    children,
    plusOnes,
    meals: Object.entries(meals)
      .map(([key, count]) => ({ key, label: mealLabel(key), count }))
      .sort((a, b) => b.count - a.count),
    unspecified: meals[MealPreference.UNSPECIFIED] ?? 0,
    allergens: ALLERGENS.filter((allergen) => allergens[allergen.key]).map((allergen) => ({
      key: allergen.key,
      label: allergen.label,
      guests: allergens[allergen.key],
    })),
    notes,
    missingChoice,
  };
}

/** The summary a caterer can read in a message. */
export function cateringReportText(report, { title = 'Our wedding' } = {}) {
  const lines = [`${title} - catering numbers`, '', `Total plates: ${report.headcount}`];
  lines.push(`Adults: ${report.adults}, children: ${report.children}`);
  lines.push('', 'Meals:', ...report.meals.map((meal) => `- ${meal.label}: ${meal.count}`));
  if (report.allergens.length) {
    lines.push(
      '',
      'Allergies to check:',
      ...report.allergens.map((a) => `- ${a.label}: ${a.guests.join(', ')}`)
    );
  }
  if (report.notes.length) {
    lines.push('', 'Dietary notes:', ...report.notes.map((n) => `- ${n.name}: ${n.note}`));
  }
  return lines.join('\n');
}

/** One row per attending guest, plus-ones on their own row. */
export function cateringCsv(guests = []) {
  const rows = [['Name', 'Meal', 'Child', 'Dietary notes', 'Allergens', 'Plus one of']];
  for (const guest of guests) {
    if (guest.rsvpStatus !== RsvpStatus.ATTENDING) continue;
    const name = guestFullName(guest);
    rows.push([
      name,
      mealLabel(guest.mealPreference),
      guest.isChild ? 'Yes' : 'No',
      guest.dietaryNotes ?? '',
      detectAllergens(guest.dietaryNotes).join('; '),
      '',
    ]);
    if (guest.plusOneStatus === PlusOneStatus.CONFIRMED) {
      rows.push([guest.plusOneName || 'Guest', mealLabel(MealPreference.UNSPECIFIED), 'No', '', '', name]);
    }
  }
  return toCsv(rows);
}
