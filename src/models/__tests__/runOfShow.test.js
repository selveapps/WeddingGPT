import { SAMPLE_DAY, findOverlaps, shiftFrom, runOfShowText } from '../runOfShow';
import { formatDuration, formatTime, parseTime } from '../../lib/time';

describe('parseTime', () => {
  it.each([
    ['16:30', 990],
    ['4:30pm', 990],
    ['4:30 PM', 990],
    ['4pm', 960],
    ['12am', 0],
    ['12:15 pm', 735],
    ['9', 540],
  ])('%s -> %i', (input, minutes) => {
    expect(parseTime(input)).toBe(minutes);
  });

  it.each(['25:00', '13pm', '4:75', 'noon', ''])('rejects %s', (input) => {
    expect(parseTime(input)).toBeNull();
  });
});

it('formats times and durations', () => {
  expect(formatTime(990)).toBe('4:30 PM');
  expect(formatTime(0)).toBe('12:00 AM');
  expect(formatTime(720)).toBe('12:00 PM');
  expect(formatDuration(90)).toBe('1h 30m');
  expect(formatDuration(45)).toBe('45m');
});

it('ships a sample day without overlaps', () => {
  expect(findOverlaps(SAMPLE_DAY.map((event, i) => ({ id: String(i), ...event })))).toEqual([]);
});

it('finds overlapping events', () => {
  const overlaps = findOverlaps([
    { id: 'a', title: 'Dinner', start: 1080, durationMin: 90 },
    { id: 'b', title: 'Speeches', start: 1140, durationMin: 30 },
    { id: 'c', title: 'Dance', start: 1160, durationMin: 30 },
  ]);
  expect(overlaps.map((pair) => [pair.first.id, pair.second.id])).toEqual([
    ['a', 'b'],
    ['a', 'c'],
    ['b', 'c'],
  ]);
});

describe('shiftFrom', () => {
  const events = [
    { id: 'a', start: 600 },
    { id: 'b', start: 660 },
    { id: 'c', start: 720 },
  ];

  it('moves the anchor and everything after it', () => {
    expect(shiftFrom(events, 'b', 20)).toEqual([
      { id: 'b', start: 680 },
      { id: 'c', start: 740 },
    ]);
  });

  it('clamps to the day and skips no-ops', () => {
    expect(shiftFrom([{ id: 'x', start: 5 }], 'x', -30)).toEqual([{ id: 'x', start: 0 }]);
    expect(shiftFrom([{ id: 'x', start: 0 }], 'x', -30)).toEqual([]);
    expect(shiftFrom(events, 'missing', 15)).toEqual([]);
  });
});

it('writes the run of show in time order', () => {
  const text = runOfShowText(
    [
      { id: 'b', title: 'Dinner', start: 1080, durationMin: 90, owner: 'Caterer' },
      { id: 'a', title: 'Ceremony', start: 960, durationMin: 30, location: 'Garden' },
    ],
    { title: 'Sam and Alex' }
  );
  expect(text.split('\n').slice(2)).toEqual([
    '4:00 PM - 4:30 PM  Ceremony (Garden)',
    '6:00 PM - 7:30 PM  Dinner (Caterer)',
  ]);
});

it('does not count back-to-back events as overlapping', () => {
  expect(
    findOverlaps([
      { id: 'a', start: 600, durationMin: 60 },
      { id: 'b', start: 660, durationMin: 30 },
    ])
  ).toEqual([]);
});
