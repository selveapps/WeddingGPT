import { sortMilestones, summariseMilestones, validateMilestone } from '../milestoneHelpers';

describe('relationship milestone helpers', () => {
  it('requires a real date, title and category', () => {
    expect(validateMilestone({ title: 'First met', date: '2024-02-29', type: 'relationship' }).isValid).toBe(
      true
    );
    expect(
      validateMilestone({ title: 'First met', date: '2023-02-29', type: 'relationship' }).errors.date
    ).toBeTruthy();
  });

  it('sorts upcoming dates before completed memories', () => {
    const items = [
      { date: '2024-01-01', completed: true },
      { date: '2027-01-01', completed: false },
      { date: '2026-01-01', completed: false },
    ];
    expect(sortMilestones(items).map((item) => item.date)).toEqual([
      '2026-01-01',
      '2027-01-01',
      '2024-01-01',
    ]);
  });

  it('summarises completed and upcoming records', () => {
    expect(summariseMilestones([{ completed: false }, { completed: true }])).toEqual({
      total: 2,
      completed: 1,
      upcoming: 1,
    });
  });
});
