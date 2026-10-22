import {
  formatTimelineTime,
  sortTimelineEvents,
  summariseTimeline,
  timeToMinutes,
  validateTimelineEvent,
} from '../timelineHelpers';

describe('timeline time helpers', () => {
  it('accepts valid 24-hour times and rejects invalid values', () => {
    expect(timeToMinutes('00:00')).toBe(0);
    expect(timeToMinutes('23:59')).toBe(1439);
    expect(timeToMinutes('24:00')).toBeNull();
    expect(timeToMinutes('9:30')).toBeNull();
    expect(timeToMinutes('')).toBeNull();
  });

  it('formats times for a readable timeline', () => {
    expect(formatTimelineTime('00:00')).toBe('12:00 AM');
    expect(formatTimelineTime('12:05')).toBe('12:05 PM');
    expect(formatTimelineTime('19:30')).toBe('7:30 PM');
  });
});

describe('sortTimelineEvents', () => {
  it('sorts chronologically without mutating the source list', () => {
    const events = [
      { id: 'late', time: '19:00', title: 'Dinner' },
      { id: 'early', time: '09:00', title: 'Getting ready' },
      { id: 'mid', time: '14:00', title: 'Ceremony' },
    ];

    expect(sortTimelineEvents(events).map((event) => event.id)).toEqual(['early', 'mid', 'late']);
    expect(events[0].id).toBe('late');
  });

  it('sorts invalid times after scheduled moments', () => {
    expect(
      sortTimelineEvents([
        { id: 'unscheduled', title: 'Details' },
        { id: 'scheduled', title: 'Ceremony', time: '14:00' },
      ]).map((event) => event.id)
    ).toEqual(['scheduled', 'unscheduled']);
  });
});

describe('validateTimelineEvent and summariseTimeline', () => {
  it('requires a title and valid time, and accepts optional details', () => {
    expect(validateTimelineEvent({}).isValid).toBe(false);
    expect(validateTimelineEvent({ title: 'Ceremony', time: '14:30' })).toEqual({
      isValid: true,
      errors: {},
    });
    expect(validateTimelineEvent({ title: 'Ceremony', time: '25:00' }).errors.time).toBeDefined();
  });

  it('counts complete and remaining moments', () => {
    expect(summariseTimeline([{ completed: true }, { completed: false }])).toEqual({
      total: 2,
      completed: 1,
      remaining: 1,
    });
    expect(summariseTimeline([]).remaining).toBe(0);
  });
});
