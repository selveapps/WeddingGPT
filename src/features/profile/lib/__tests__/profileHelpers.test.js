import {
  areProfileValuesEqual,
  buildSummaryRows,
  buildWorkspacePatches,
  calculateProfileCompleteness,
  completenessTone,
  formatBudgetLine,
  formatGuestLine,
  formatLocationLine,
  formatWeddingDateLine,
  heroSubtitle,
  isProfileFieldFilled,
  parseGuestCountInput,
  toggleListValue,
  valuesFromWorkspace,
} from '../profileHelpers';
import { EMPTY_PROFILE_VALUES, PROFILE_COPY } from '../profileConstants';

const filled = {
  ...EMPTY_PROFILE_VALUES,
  ownerName: 'Priya',
  email: 'priya@example.com',
  phone: '555 123 4567',
  partnerName: 'Sam',
  date: '2027-09-12',
  dateType: 'exact',
  city: 'Austin',
  region: 'TX',
  guestCountEstimate: 120,
  budgetTotal: 4500000,
  ceremonyType: 'ceremony_and_reception',
  planningStage: 'early_planning',
  styleTags: ['garden'],
};

describe('valuesFromWorkspace', () => {
  it('returns empty values before onboarding', () => {
    expect(valuesFromWorkspace()).toEqual(EMPTY_PROFILE_VALUES);
  });

  it('prefers wedding fields and falls back to user and couple', () => {
    const values = valuesFromWorkspace({
      user: { name: 'Priya', email: 'p@example.com' },
      couple: { partnerName: 'Sam', collaborationEnabled: 1 },
      wedding: { city: 'Austin', guestCountEstimate: '80', styleTags: ['modern'] },
    });
    expect(values.ownerName).toBe('Priya');
    expect(values.partnerName).toBe('Sam');
    expect(values.collaborationEnabled).toBe(true);
    expect(values.guestCountEstimate).toBe(80);
    expect(values.budgetTotal).toBeNull();
    expect(values.styleTags).toEqual(['modern']);
  });

  it('copies arrays so edits do not leak back into the store', () => {
    const wedding = { styleTags: ['garden'] };
    valuesFromWorkspace({ wedding }).styleTags.push('modern');
    expect(wedding.styleTags).toEqual(['garden']);
  });
});

describe('areProfileValuesEqual', () => {
  it('compares scalars and arrays by value', () => {
    expect(areProfileValuesEqual(filled, { ...filled, styleTags: ['garden'] })).toBe(true);
    expect(areProfileValuesEqual(filled, { ...filled, styleTags: ['modern'] })).toBe(false);
    expect(areProfileValuesEqual(filled, { ...filled, city: 'Dallas' })).toBe(false);
  });

  it('treats a missing array as empty', () => {
    expect(
      areProfileValuesEqual(EMPTY_PROFILE_VALUES, { ...EMPTY_PROFILE_VALUES, stressors: undefined })
    ).toBe(true);
  });

  it('handles null inputs', () => {
    expect(areProfileValuesEqual(null, filled)).toBe(false);
    expect(areProfileValuesEqual(null, null)).toBe(true);
  });
});

describe('isProfileFieldFilled', () => {
  it('does not count defaults as filled', () => {
    expect(isProfileFieldFilled(EMPTY_PROFILE_VALUES, 'ceremonyType')).toBe(false);
    expect(isProfileFieldFilled(EMPTY_PROFILE_VALUES, 'styleTags')).toBe(false);
    expect(isProfileFieldFilled({ ownerName: '   ' }, 'ownerName')).toBe(false);
  });

  it('needs a positive number for counts and money', () => {
    expect(isProfileFieldFilled({ budgetTotal: 0 }, 'budgetTotal')).toBe(false);
    expect(isProfileFieldFilled({ guestCountEstimate: 40 }, 'guestCountEstimate')).toBe(true);
  });
});

describe('calculateProfileCompleteness', () => {
  it('scores an empty profile low and lists what is missing', () => {
    const result = calculateProfileCompleteness(EMPTY_PROFILE_VALUES);
    // planningStage has a default, so it is the only field already filled.
    expect(result.filledCount).toBe(1);
    expect(result.missing.map((m) => m.key)).toContain('ownerName');
    expect(result.percent).toBe(Math.round((1 / result.possible) * 100));
  });

  it('reaches 100 when everything is filled', () => {
    const result = calculateProfileCompleteness(filled);
    expect(result.percent).toBe(100);
    expect(result.missing).toEqual([]);
    expect(result.filledCount).toBe(result.totalCount);
  });
});

describe('buildWorkspacePatches', () => {
  it('trims strings and turns empty optional fields into null', () => {
    const { user, couple, wedding } = buildWorkspacePatches({
      ...EMPTY_PROFILE_VALUES,
      ownerName: '  Priya ',
      email: '   ',
      venueName: '',
      city: ' Austin ',
    });
    expect(user).toEqual({ name: 'Priya', email: null, phone: null });
    expect(couple.partnerEmail).toBeNull();
    expect(wedding.venueName).toBeNull();
    expect(wedding.city).toBe('Austin');
  });

  it('coerces numbers and drops ones that are not finite', () => {
    const { wedding } = buildWorkspacePatches({
      ...filled,
      guestCountEstimate: '90',
      budgetTotal: 'lots',
    });
    expect(wedding.guestCountEstimate).toBe(90);
    expect(wedding.budgetTotal).toBeNull();
  });
});

describe('toggleListValue', () => {
  it('adds and removes values without mutating the list', () => {
    const list = ['a'];
    expect(toggleListValue(list, 'b')).toEqual(['a', 'b']);
    expect(toggleListValue(list, 'a')).toEqual([]);
    expect(list).toEqual(['a']);
  });

  it('clears exclusive options when a new one is picked', () => {
    expect(toggleListValue(['none'], 'budget', { exclusiveWith: ['none'] })).toEqual(['budget']);
  });

  it('tolerates a missing list', () => {
    expect(toggleListValue(undefined, 'a')).toEqual(['a']);
  });
});

describe('display lines', () => {
  it('formats the wedding date by precision', () => {
    expect(formatWeddingDateLine(filled)).toBe('September 12, 2027');
    expect(formatWeddingDateLine({ date: '2027-09-01', dateType: 'month' })).toBe('September 2027');
    expect(formatWeddingDateLine({ date: null, dateType: 'undecided' })).toBe('Date not set yet');
    expect(formatWeddingDateLine({ date: null, dateType: 'year' })).toBe('Year');
  });

  it('joins location parts that are set', () => {
    expect(formatLocationLine(filled)).toBe('Austin, TX');
    expect(formatLocationLine({ city: ' ', country: 'USA' })).toBe('USA');
    expect(formatLocationLine({})).toBe('Location not set yet');
  });

  it('formats budget and guests', () => {
    expect(formatBudgetLine(filled)).toBe('$45,000');
    expect(formatBudgetLine({})).toBe('Budget not set yet');
    expect(formatGuestLine(filled)).toBe('About 120 guests');
    expect(formatGuestLine({ guestCountEstimate: 1 })).toBe('About 1 guest');
    expect(formatGuestLine({ guestCountEstimate: 'many' })).toBe('Guest count not set yet');
  });

  it('builds a hero subtitle from whatever is known', () => {
    expect(heroSubtitle(EMPTY_PROFILE_VALUES)).toBe(PROFILE_COPY.screenSubtitle);
    expect(heroSubtitle({ city: 'Austin' })).toBe('Austin');
    expect(heroSubtitle(filled)).toBe('September 12, 2027 · Austin, TX');
  });

  it('summarises long style lists', () => {
    const rows = buildSummaryRows({
      ...filled,
      styleTags: ['garden', 'classic', 'modern', 'rustic'],
    });
    expect(rows.find((row) => row.id === 'style').value).toBe('Garden romantic, Timeless classic +2');
    expect(rows.find((row) => row.id === 'names').value).toBe('Priya and Sam');
  });
});

describe('completenessTone', () => {
  it('steps through tones by percentage', () => {
    expect(completenessTone(95)).toBe('success');
    expect(completenessTone(60)).toBe('brand');
    expect(completenessTone(30)).toBe('warning');
    expect(completenessTone(10)).toBe('neutral');
  });
});

describe('parseGuestCountInput', () => {
  it('keeps digits only', () => {
    expect(parseGuestCountInput('about 150')).toBe(150);
    expect(parseGuestCountInput('1,200')).toBe(1200);
  });

  it('returns null for empty input', () => {
    expect(parseGuestCountInput('')).toBeNull();
    expect(parseGuestCountInput('lots')).toBeNull();
    expect(parseGuestCountInput(null)).toBeNull();
  });
});
