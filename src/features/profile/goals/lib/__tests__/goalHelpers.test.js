import { sortGoals, summariseGoals, validateGoal } from '../goalHelpers';

const goal = { title: 'Plan a date night', category: 'together', priority: 'steady', dueDate: '' };

describe('couple goal helpers', () => {
  it('validates required labels, category, priority and optional dates', () => {
    expect(validateGoal(goal).isValid).toBe(true);
    expect(validateGoal({ ...goal, dueDate: '2026-02-30' }).errors.dueDate).toBeTruthy();
    expect(validateGoal({ ...goal, category: 'unknown' }).errors.category).toBeTruthy();
  });

  it('sorts active goals first by date and puts completed goals last', () => {
    const goals = [
      { completed: true, dueDate: '' },
      { completed: false, dueDate: '2027-01-01' },
      { completed: false, dueDate: '2026-01-01' },
    ];
    expect(sortGoals(goals)).toEqual([goals[2], goals[1], goals[0]]);
  });

  it('calculates completion without dividing by zero', () => {
    expect(summariseGoals([]).completionPercent).toBe(0);
    expect(summariseGoals([{ completed: true }, { completed: false }])).toMatchObject({
      active: 1,
      completed: 1,
      completionPercent: 50,
    });
  });
});
