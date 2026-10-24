import { buildTimelineText, findTimelineConflicts, sortTimeline } from '../timelineModel';
import { getVendorComparison, remainingVendorBalance, validateVendorDraft } from '../vendorCompareModel';
import { generateChecklist, summarizeChecklist, toggleChecklistTask } from '../checklistModel';

describe('timelineModel', () => {
  it('sorts timeline items by start time', () => {
    expect(sortTimeline([{ id: 'b', title: 'B', time: '12:00', duration: 10 }, { id: 'a', title: 'A', time: '09:00', duration: 10 }]).map((x) => x.id)).toEqual(['a', 'b']);
  });
  it('detects overlapping events', () => {
    const conflicts = findTimelineConflicts([{ id: 'a', title: 'Photos', time: '10:00', duration: 60 }, { id: 'b', title: 'Ceremony', time: '10:30', duration: 30 }]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].overlapMinutes).toBe(30);
  });
  it('exports schedule text', () => {
    expect(buildTimelineText([{ id: 'a', title: 'Ceremony', time: '10:00', duration: 30 }])).toContain('Ceremony');
  });
});

describe('vendorCompareModel', () => {
  it('calculates outstanding balance without going below zero', () => {
    expect(remainingVendorBalance({ quote: 1000, deposit: 1200 })).toBe(0);
  });
  it('validates required vendor fields', () => {
    expect(validateVendorDraft({ name: '', category: '', quote: -1 }).name).toBeTruthy();
  });
  it('ranks available vendors ahead of unavailable vendors at equal inputs', () => {
    const result = getVendorComparison([
      { id: 'a', name: 'A', quote: 1000, rating: 4, available: true },
      { id: 'b', name: 'B', quote: 1000, rating: 4, available: false },
    ]);
    expect(result[0].id).toBe('a');
  });
});

describe('checklistModel', () => {
  it('rejects invalid wedding dates', () => {
    expect(generateChecklist('not-a-date').error).toBeTruthy();
  });
  it('generates tasks for a valid date', () => {
    const result = generateChecklist('2027-06-12', { now: '2026-01-01T00:00:00' });
    expect(result.error).toBeNull();
    expect(result.tasks.length).toBeGreaterThan(5);
  });
  it('toggles completion', () => {
    const tasks = [{ id: 'one', done: false }];
    expect(toggleChecklistTask(tasks, 'one')[0].done).toBe(true);
  });
  it('summarizes progress', () => {
    expect(summarizeChecklist([{ id: 'a', done: true }, { id: 'b', done: false }]).percent).toBe(50);
  });
});
