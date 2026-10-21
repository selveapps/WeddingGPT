import {
  CHECKLIST_TEMPLATE,
  firstRecommendedActions,
  generatePersonalisedPlan,
  planningHorizonMonths,
} from '../planGeneration';
import { DateType, PlanningStage } from '../enums';

const FROM = new Date(2027, 0, 4); // Monday 4 Jan 2027

const wedding = (extra = {}) => ({
  id: 'wed_1',
  date: '2028-01-08',
  dateType: DateType.EXACT,
  planningStage: PlanningStage.EARLY_PLANNING,
  ...extra,
});

describe('planningHorizonMonths', () => {
  it('measures from a usable date', () => {
    expect(planningHorizonMonths(wedding(), FROM)).toBe(12);
    expect(planningHorizonMonths(wedding({ date: '2027-07-04', dateType: DateType.MONTH }), FROM)).toBe(6);
  });

  it('never goes negative for a date that has passed', () => {
    expect(planningHorizonMonths(wedding({ date: '2026-06-01' }), FROM)).toBe(0);
  });

  it('falls back to the planning stage without a usable date', () => {
    expect(planningHorizonMonths(wedding({ date: null }), FROM)).toBe(12);
    expect(
      planningHorizonMonths(
        wedding({ date: '2027-06-01', dateType: DateType.YEAR, planningStage: PlanningStage.ALMOST_THERE }),
        FROM
      )
    ).toBe(1);
    expect(planningHorizonMonths({ planningStage: PlanningStage.JUST_ENGAGED }, FROM)).toBe(14);
  });

  it('defaults to a year when nothing is known', () => {
    expect(planningHorizonMonths(undefined, FROM)).toBe(12);
  });
});

describe('generatePersonalisedPlan', () => {
  it('returns an empty plan without a wedding', () => {
    expect(generatePersonalisedPlan({ from: FROM })).toEqual({ tasks: [], horizonMonths: 0 });
  });

  it('generates the whole template for a long runway', () => {
    const { tasks, horizonMonths } = generatePersonalisedPlan({ wedding: wedding(), from: FROM });
    expect(horizonMonths).toBe(12);
    expect(tasks).toHaveLength(CHECKLIST_TEMPLATE.filter((e) => e.essential || e.monthsBefore <= 12).length);
  });

  it('keeps only essential long-window tasks for a short runway', () => {
    const { tasks } = generatePersonalisedPlan({
      wedding: wedding({ date: '2027-03-06' }),
      from: FROM,
    });
    const titles = new Set(tasks.map((task) => task.title));
    for (const entry of CHECKLIST_TEMPLATE) {
      const expected = entry.essential || entry.monthsBefore <= 2;
      expect(titles.has(entry.title)).toBe(expected);
    }
  });

  it('never schedules a task in the past or sooner than three days out', () => {
    const { tasks } = generatePersonalisedPlan({
      wedding: wedding({ date: '2027-03-06' }),
      from: FROM,
    });
    for (const task of tasks) {
      expect(task.dueDate >= '2027-01-07').toBe(true);
    }
  });

  it('staggers pulled-forward tasks three days apart', () => {
    const { tasks } = generatePersonalisedPlan({
      wedding: wedding({ date: '2027-03-06' }),
      from: FROM,
    });
    const dates = tasks.map((task) => task.dueDate);
    expect(dates.slice(0, 3)).toEqual(['2027-01-07', '2027-01-10', '2027-01-13']);
  });

  it('uses natural due dates when there is time for them', () => {
    const { tasks } = generatePersonalisedPlan({ wedding: wedding(), from: FROM });
    const venue = tasks.find((task) => task.title === 'Shortlist venues');
    expect(venue.dueDate).toBe('2027-02-08'); // eleven months before 8 Jan 2028
  });

  it('links tasks to categories by key and marks them system generated', () => {
    const { tasks } = generatePersonalisedPlan({
      wedding: wedding(),
      categories: [{ key: 'venue', id: 'tcat_venue' }],
      from: FROM,
    });
    const venue = tasks.find((task) => task.title === 'Shortlist venues');
    const other = tasks.find((task) => task.title === 'Agree the feeling you want');
    expect(venue.categoryId).toBe('tcat_venue');
    expect(other.categoryId).toBeNull();
    expect(tasks.every((task) => task.isSystemGenerated && task.weddingId === 'wed_1')).toBe(true);
  });

  it('plans from today when the date is undecided', () => {
    const { tasks, horizonMonths } = generatePersonalisedPlan({
      wedding: wedding({ date: null, dateType: DateType.UNDECIDED, planningStage: PlanningStage.FINAL_STRETCH }),
      from: FROM,
    });
    expect(horizonMonths).toBe(4);
    const kit = tasks.find((task) => task.title === 'Pack an emergency kit');
    expect(kit.dueDate).toBe('2027-05-04');
  });
});

describe('firstRecommendedActions', () => {
  const tasks = [
    { id: 'c', dueDate: '2027-03-01' },
    { id: 'none', dueDate: null },
    { id: 'a', dueDate: '2027-01-10' },
    { id: 'b', dueDate: '2027-02-01' },
    { id: 'd', dueDate: '2027-04-01' },
  ];

  it('picks the three soonest dated tasks', () => {
    expect(firstRecommendedActions(tasks).map((task) => task.id)).toEqual(['a', 'b', 'c']);
  });

  it('respects a custom count and does not mutate the input', () => {
    const copy = [...tasks];
    expect(firstRecommendedActions(tasks, 1).map((task) => task.id)).toEqual(['a']);
    expect(tasks).toEqual(copy);
  });

  it('handles an empty list', () => {
    expect(firstRecommendedActions()).toEqual([]);
  });
});
