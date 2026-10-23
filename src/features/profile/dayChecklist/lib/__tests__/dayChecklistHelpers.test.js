import {
  checklistTimeToMinutes,
  filterDayChecklistTasks,
  sortDayChecklistTasks,
  summariseDayChecklist,
  validateDayChecklistTask,
} from '../dayChecklistHelpers';

describe('wedding-day checklist helpers', () => {
  it('accepts optional valid times and rejects malformed values', () => {
    expect(checklistTimeToMinutes('00:00')).toBe(0);
    expect(checklistTimeToMinutes('23:59')).toBe(1439);
    expect(checklistTimeToMinutes('24:00')).toBeNull();
    expect(checklistTimeToMinutes('9:30')).toBeNull();
    expect(validateDayChecklistTask({ title: 'Pack rings', category: 'ceremony', priority: 'high' })).toEqual(
      { isValid: true, errors: {} }
    );
    expect(
      validateDayChecklistTask({
        title: 'Pack rings',
        time: '24:00',
        category: 'ceremony',
        priority: 'high',
      }).errors.time
    ).toBeDefined();
  });

  it('sorts open tasks by category and time before completed tasks without mutating', () => {
    const tasks = [
      { id: 'done', title: 'Pack', category: 'getting-ready', time: '07:00', completed: true },
      { id: 'late', title: 'Flowers', category: 'getting-ready', time: '10:00' },
      { id: 'ceremony', title: 'License', category: 'ceremony', time: '08:00' },
      { id: 'early', title: 'Breakfast', category: 'getting-ready', time: '08:00' },
    ];
    expect(sortDayChecklistTasks(tasks).map((task) => task.id)).toEqual([
      'early',
      'late',
      'ceremony',
      'done',
    ]);
    expect(tasks[0].id).toBe('done');
  });

  it('summarizes progress and filters by status, category and searchable details', () => {
    const tasks = [
      { title: 'Pack rings', category: 'ceremony', owner: 'Maya', note: '', completed: false },
      { title: 'Collect flowers', category: 'getting-ready', owner: 'Alex', note: '', completed: true },
    ];
    expect(summariseDayChecklist(tasks)).toEqual({
      total: 2,
      completed: 1,
      remaining: 1,
      completionPercent: 50,
    });
    expect(filterDayChecklistTasks(tasks, { status: 'open', category: 'ceremony' })).toHaveLength(1);
    expect(filterDayChecklistTasks(tasks, { query: 'maya' })).toHaveLength(1);
    expect(summariseDayChecklist([]).completionPercent).toBe(0);
  });
});
