import { buildProfileBudgetSnapshot, budgetStatusLabel, profileBudgetProgress } from '../budgetSnapshot';

describe('profile budget snapshot', () => {
  it('returns no snapshot until a budget exists', () => {
    expect(buildProfileBudgetSnapshot(null, [])).toBeNull();
    expect(budgetStatusLabel(null)).toBe('No budget yet');
  });

  it('derives remaining and progress from actual expenses', () => {
    const snapshot = buildProfileBudgetSnapshot({ total: 100000, currency: 'USD' }, [
      { amount: 30000, paidAmount: 10000, commitment: 'committed' },
    ]);
    expect(snapshot).toMatchObject({ spent: 10000, committed: 20000, remaining: 70000 });
    expect(profileBudgetProgress(snapshot)).toBe(0.3);
  });

  it('identifies configured and over-budget states', () => {
    const snapshot = buildProfileBudgetSnapshot({ total: 1000 }, [
      { amount: 1400, paidAmount: 0, commitment: 'committed' },
    ]);
    expect(budgetStatusLabel(snapshot)).toBe('Over budget');
  });
});
