import { filterItems, progressPercent, readinessIssues, boardSections } from '../attireSelectors';

describe('attireSelectors', () => {
  const items = [
    { id: '1', title: 'Gown', role: 'bride', status: 'ready', rental: false },
    { id: '2', title: 'Suit', role: 'groom', status: 'ordered', rental: true },
    { id: '3', title: 'BM dress', role: 'bridesmaid', status: 'idea', rental: false },
  ];

  it('filters by role', () => {
    expect(filterItems(items, { role: 'bride' })).toHaveLength(1);
  });

  it('filters rentals', () => {
    expect(filterItems(items, { rentalOnly: true })).toHaveLength(1);
  });

  it('progress percent', () => {
    expect(progressPercent({ itemCount: 4, readyRatio: 0.5 })).toBe(50);
    expect(progressPercent({ itemCount: 0 })).toBe(0);
  });

  it('readiness issues for missing fittings', () => {
    const issues = readinessIssues(items, [], []);
    expect(issues.some((i) => i.type === 'no_fitting')).toBe(true);
  });

  it('board sections group roles', () => {
    const sections = boardSections(items);
    expect(sections.length).toBeGreaterThan(0);
  });
});
