import { RsvpStatus, PlusOneStatus, MealPreference } from '@/models';

import { csvCell, toCsv } from '@/lib/csv';
import { buildCateringReport, cateringCsv, cateringReportText, detectAllergens } from '../model';

const guest = (firstName, fields = {}) => ({
  id: firstName,
  firstName,
  lastName: 'Lee',
  rsvpStatus: RsvpStatus.ATTENDING,
  mealPreference: MealPreference.STANDARD,
  dietaryNotes: '',
  ...fields,
});

describe('detectAllergens', () => {
  it('finds common allergens in free text', () => {
    expect(detectAllergens('Severe peanut allergy, also no shrimp')).toEqual(['nuts', 'shellfish']);
    expect(detectAllergens('Coeliac')).toEqual(['gluten']);
    expect(detectAllergens('')).toEqual([]);
  });

  it('ignores notes saying something is fine', () => {
    expect(detectAllergens('Dairy is not an issue')).toEqual([]);
  });
});

describe('buildCateringReport', () => {
  const guests = [
    guest('Ana', { plusOneStatus: PlusOneStatus.CONFIRMED }),
    guest('Ben', { mealPreference: MealPreference.VEGAN, dietaryNotes: 'Allergic to sesame' }),
    guest('Cam', { isChild: true, mealPreference: MealPreference.UNSPECIFIED }),
    guest('Dee', { rsvpStatus: RsvpStatus.DECLINED, dietaryNotes: 'nuts' }),
  ];
  const report = buildCateringReport(guests);

  it('counts attending guests and confirmed plus-ones only', () => {
    expect(report).toMatchObject({ headcount: 4, adults: 3, children: 1, plusOnes: 1 });
  });

  it('tallies meals, with plus-ones as not specified', () => {
    const meals = Object.fromEntries(report.meals.map((m) => [m.key, m.count]));
    expect(meals).toEqual({ standard: 1, vegan: 1, unspecified: 2 });
    expect(report.missingChoice.map((g) => g.id)).toEqual(['Cam']);
  });

  it('flags allergens by guest, ignoring declined guests', () => {
    expect(report.allergens).toEqual([{ key: 'sesame', label: 'Sesame', guests: ['Ben Lee'] }]);
  });

  it('writes a readable summary', () => {
    const text = cateringReportText(report, { title: 'Ana and Ben' });
    expect(text).toContain('Total plates: 4');
    expect(text).toContain('- Sesame: Ben Lee');
  });

  it('exports CSV with plus-ones on their own row', () => {
    const lines = cateringCsv(guests).split('\n');
    expect(lines[0]).toBe('Name,Meal,Child,Dietary notes,Allergens,Plus one of');
    expect(lines).toHaveLength(5);
    expect(lines[2]).toBe('Guest,Not specified,No,,,Ana Lee');
  });
});

describe('csv', () => {
  it('quotes and neutralises risky cells', () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('=SUM(A1)')).toBe("'=SUM(A1)");
    expect(toCsv([[1, null], ['x', 'y']])).toBe('1,\nx,y');
  });
});
