import {
  appendMissingDefaults,
  createEmergencyItem,
  createDefaultEmergencyPlan,
  formatEmergencyPlanForSharing,
  getEmergencyProgress,
  normaliseEmergencyPlan,
  toggleEmergencyItem,
} from '../emergencyPlanModel';

describe('emergencyPlanModel', () => {
  test('creates a default plan with suggested tasks', () => {
    const plan = createDefaultEmergencyPlan();
    expect(plan.version).toBe(1);
    expect(plan.items.length).toBeGreaterThan(0);
    expect(plan.items.every((item) => item.id && item.title)).toBe(true);
  });

  test('normalises missing or invalid data safely', () => {
    const plan = normaliseEmergencyPlan(null);
    expect(plan.items.length).toBeGreaterThan(0);
    expect(plan.venue).toBe('');
    expect(normaliseEmergencyPlan({ items: 'not-an-array' }).items.length).toBeGreaterThan(0);
  });

  test('bounds titles and owner values', () => {
    const item = createEmergencyItem({ title: 'x'.repeat(300), owner: 'y'.repeat(200) });
    expect(item.title).toHaveLength(120);
    expect(item.owner).toHaveLength(80);
  });

  test('toggles only the selected item without mutating the original', () => {
    const items = [
      { id: 'one', title: 'Confirm transport', done: false },
      { id: 'two', title: 'Pack charger', done: false },
    ];
    const next = toggleEmergencyItem(items, 'two');
    expect(next[0].done).toBe(false);
    expect(next[1].done).toBe(true);
    expect(items[1].done).toBe(false);
  });

  test('ignores an unknown toggle ID', () => {
    const items = [{ id: 'one', title: 'Task', done: false }];
    expect(toggleEmergencyItem(items, 'missing')).toEqual(items);
  });

  test('calculates progress including the empty-list edge case', () => {
    expect(getEmergencyProgress([])).toEqual({ total: 0, done: 0, remaining: 0, percent: 0 });
    expect(getEmergencyProgress([{ done: true }, { done: false }, { done: true }])).toEqual({
      total: 3,
      done: 2,
      remaining: 1,
      percent: 67,
    });
  });

  test('adds only missing default tasks and preserves existing custom rows', () => {
    const existing = [createEmergencyItem({ id: 'custom', title: 'Bring instant camera', custom: true })];
    const result = appendMissingDefaults(existing);
    expect(result.some((item) => item.id === 'custom')).toBe(true);
    expect(result.length).toBeGreaterThan(existing.length);
    expect(appendMissingDefaults(result).length).toBe(result.length);
  });

  test('normalises duplicate IDs into unique stable IDs', () => {
    const plan = normaliseEmergencyPlan({
      items: [
        { id: 'same', title: 'First task' },
        { id: 'same', title: 'Second task' },
      ],
    });
    expect(new Set(plan.items.map((item) => item.id)).size).toBe(2);
  });

  test('formats a readable share message without leaking implementation data', () => {
    const output = formatEmergencyPlanForSharing({
      venue: 'Rose Hall',
      primaryContact: 'Coordinator · 555-0100',
      items: [{ id: 't1', title: 'Confirm florist', owner: 'Maya', done: true }],
      notes: 'Use side entrance',
    });
    expect(output).toContain('WEDDING DAY EMERGENCY PLAN');
    expect(output).toContain('Venue: Rose Hall');
    expect(output).toContain('[x] Confirm florist — Maya');
    expect(output).toContain('Notes: Use side entrance');
    expect(output).not.toContain('createdAt');
  });
});
