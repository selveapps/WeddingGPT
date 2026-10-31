import { DEFAULT_EVENT_MINUTES, calendarEntries, calendarIcs, foldLine, icsText } from '../calendar';

const event = (fields = {}) => ({
  id: 'ev1',
  kind: 'mehndi',
  name: 'Mehndi',
  date: '2027-02-12',
  startTime: '16:00',
  endTime: '21:00',
  venueName: 'The Rose Garden',
  address: '12 Park Lane',
  dressCode: 'Bright colours',
  notes: 'Henna from 5.',
  ...fields,
});

const wedding = { ownerName: 'Priya', partnerName: 'Sam' };

describe('calendarEntries', () => {
  it('gives each dated event its local start and end, place and notes', () => {
    const [entry] = calendarEntries({ events: [event()], wedding });
    expect(entry).toEqual({
      key: 'ev1',
      title: "Mehndi - Priya and Sam's wedding",
      allDay: false,
      start: new Date(2027, 1, 12, 16, 0),
      end: new Date(2027, 1, 12, 21, 0),
      location: 'The Rose Garden, 12 Park Lane',
      notes: 'Dress code: Bright colours\n\nHenna from 5.',
    });
  });

  it('runs past midnight when the end is before the start', () => {
    const [entry] = calendarEntries({ events: [event({ startTime: '20:00', endTime: '01:30' })] });
    expect(entry.end).toEqual(new Date(2027, 1, 13, 1, 30));
  });

  it('gives an event without an end a default length, and one without a start the whole day', () => {
    const [timed, allDay] = calendarEntries({
      events: [
        event({ endTime: null }),
        event({ id: 'ev2', date: '2027-02-13', startTime: null, endTime: null }),
      ],
    });
    expect(timed.end - timed.start).toBe(DEFAULT_EVENT_MINUTES * 60 * 1000);
    expect(allDay.allDay).toBe(true);
    expect(allDay.start).toEqual(new Date(2027, 1, 13));
    expect(allDay.end).toEqual(new Date(2027, 1, 14));
  });

  it('leaves out undated events and sorts the rest', () => {
    const entries = calendarEntries({
      events: [event({ id: 'late', date: '2027-03-01' }), event({ id: 'none', date: null }), event()],
    });
    expect(entries.map((entry) => entry.key)).toEqual(['ev1', 'late']);
  });

  it('titles events by name alone when the couple has no names yet', () => {
    expect(calendarEntries({ events: [event()], wedding: {} })[0].title).toBe('Mehndi');
  });
});

describe('calendarIcs', () => {
  const NOW = new Date(Date.UTC(2027, 0, 4, 7, 0, 0));

  it('writes a calendar any app can open', () => {
    const ics = calendarIcs(calendarEntries({ events: [event()], wedding }), { now: NOW });
    const lines = ics.split('\r\n');
    expect(lines[0]).toBe('BEGIN:VCALENDAR');
    expect(lines).toEqual(
      expect.arrayContaining([
        'BEGIN:VEVENT',
        'UID:ev1@weddinggpt.app',
        'DTSTAMP:20270104T070000Z',
        'DTSTART:20270212T160000',
        'DTEND:20270212T210000',
        "SUMMARY:Mehndi - Priya and Sam's wedding",
        'LOCATION:The Rose Garden\\, 12 Park Lane',
        'DESCRIPTION:Dress code: Bright colours\\n\\nHenna from 5.',
        'END:VEVENT',
        'END:VCALENDAR',
      ])
    );
    expect(ics.endsWith('\r\n')).toBe(true);
  });

  it('marks all-day events with dates only', () => {
    const ics = calendarIcs(calendarEntries({ events: [event({ startTime: null })] }), { now: NOW });
    expect(ics).toContain('DTSTART;VALUE=DATE:20270212');
    expect(ics).toContain('DTEND;VALUE=DATE:20270213');
  });
});

describe('icsText and foldLine', () => {
  it('escapes the characters calendars treat specially', () => {
    expect(icsText('a\\b;c,d\ne')).toBe('a\\\\b\\;c\\,d\\ne');
  });

  it('folds long lines at 75 octets without splitting a character', () => {
    const line = `DESCRIPTION:${'é'.repeat(60)}`;
    const folded = foldLine(line);
    const parts = folded.split('\r\n');
    expect(parts.length).toBeGreaterThan(1);
    for (const part of parts) expect(new TextEncoder().encode(part).length).toBeLessThanOrEqual(75);
    expect(parts.map((part, i) => (i ? part.slice(1) : part)).join('')).toBe(line);
    expect(foldLine('SHORT:line')).toBe('SHORT:line');
  });
});
