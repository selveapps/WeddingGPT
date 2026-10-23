import {
  EventKind,
  GuestScope,
  RsvpStatus,
  clockFromInput,
  createGuest,
  createWeddingEvent,
  eventGuestSummary,
  guestEventStatus,
  eventGuests,
  eventName,
  eventWhen,
  eventsToWebsiteSchedule,
  mergeWebsiteSchedule,
  sortEvents,
  validateEvent,
} from '@/models';
import { formatTimeRange, fromClock, toClock } from '@/lib/time';

const event = (fields) => createWeddingEvent({ weddingId: 'w1', ...fields });

describe('createWeddingEvent', () => {
  it('names an unnamed event after its kind', () => {
    expect(event({ kind: EventKind.MEHNDI }).name).toBe('Mehndi');
    expect(event({ kind: EventKind.MEHNDI, name: '  Henna night ' }).name).toBe('Henna night');
    expect(event({}).name).toBe('Other');
  });

  it('defaults to everyone invited', () => {
    const made = event({});
    expect(made.guestScope).toBe(GuestScope.EVERYONE);
    expect(made.invitedGuestIds).toEqual([]);
    expect(made.id).toMatch(/^event_/);
  });
});

describe('eventName', () => {
  it('falls back to the kind, then to "Event"', () => {
    expect(eventName({ name: ' ', kind: EventKind.BRUNCH })).toBe('Farewell brunch');
    expect(eventName({ kind: 'unknown' })).toBe('Event');
    expect(eventName(null)).toBe('Event');
  });
});

describe('sortEvents', () => {
  it('orders by date, then start time, then order, with undated events last', () => {
    const undated = event({ name: 'Undated' });
    const fridayNight = event({ name: 'Fri 7pm', date: '2027-05-07', startTime: '19:00' });
    const fridayNoTime = event({ name: 'Fri', date: '2027-05-07' });
    const saturdayB = event({ name: 'Sat B', date: '2027-05-08', startTime: '16:00', order: 2 });
    const saturdayA = event({ name: 'Sat A', date: '2027-05-08', startTime: '16:00', order: 1 });
    const fridayLunch = event({ name: 'Fri 12', date: '2027-05-07', startTime: '12:00' });

    const names = sortEvents([undated, saturdayB, fridayNight, fridayNoTime, saturdayA, fridayLunch]).map(
      (e) => e.name
    );
    expect(names).toEqual(['Fri 12', 'Fri 7pm', 'Fri', 'Sat A', 'Sat B', 'Undated']);
  });

  it('does not change the list it is given', () => {
    const list = [event({ date: '2027-05-08' }), event({ date: '2027-05-07' })];
    const before = list.map((e) => e.id);
    sortEvents(list);
    expect(list.map((e) => e.id)).toEqual(before);
  });
});

describe('guests of an event', () => {
  const guests = [
    createGuest({ firstName: 'A', rsvpStatus: RsvpStatus.ATTENDING }),
    createGuest({ firstName: 'B', rsvpStatus: RsvpStatus.DECLINED }),
    createGuest({ firstName: 'C' }),
  ];

  it('is everyone, unless the event has its own list', () => {
    expect(eventGuests(event({}), guests)).toHaveLength(3);
    const invited = event({ guestScope: GuestScope.INVITED, invitedGuestIds: [guests[0].id, 'gone'] });
    expect(eventGuests(invited, guests).map((g) => g.firstName)).toEqual(['A']);
  });

  it('counts replies among the invited', () => {
    expect(eventGuestSummary(event({}), guests)).toEqual({
      invited: 3,
      attending: 1,
      declined: 1,
      awaiting: 1,
    });
    const invited = event({ guestScope: GuestScope.INVITED, invitedGuestIds: [guests[1].id, guests[2].id] });
    expect(eventGuestSummary(invited, guests)).toEqual({
      invited: 2,
      attending: 0,
      declined: 1,
      awaiting: 1,
    });
  });
});

describe('times', () => {
  it('reads what couples type into stored clocks', () => {
    expect(clockFromInput('4pm')).toBe('16:00');
    expect(clockFromInput('16:30')).toBe('16:30');
    expect(clockFromInput('9:05 am')).toBe('09:05');
    expect(clockFromInput('12am')).toBe('00:00');
    expect(clockFromInput('')).toBeNull();
    expect(clockFromInput('teatime')).toBeNull();
    expect(clockFromInput('25:00')).toBeNull();
  });

  it('converts clocks to minutes and back', () => {
    expect(fromClock('16:30')).toBe(990);
    expect(toClock(990)).toBe('16:30');
    expect(fromClock('nonsense')).toBeNull();
    expect(fromClock(null)).toBeNull();
  });

  it('shows a range, or whichever end is known', () => {
    expect(eventWhen({ startTime: '16:00', endTime: '22:30' })).toBe(formatTimeRange('16:00', '22:30'));
    expect(eventWhen({ startTime: '16:00', endTime: '22:30' })).toContain('4:00 PM');
    expect(eventWhen({ startTime: '16:00', endTime: '22:30' })).toContain('10:30 PM');
    expect(eventWhen({})).toBe('');
  });
});

describe('validateEvent', () => {
  it('accepts an empty event', () => {
    expect(validateEvent({})).toEqual({});
  });

  it('explains times it cannot read', () => {
    expect(validateEvent({ startTimeText: 'after lunch' }).startTime).toMatch(/4pm/);
    expect(validateEvent({ endTimeText: '99' }).endTime).toMatch(/10pm/);
  });

  it('allows an end past midnight but not an end equal to the start', () => {
    expect(validateEvent({ startTimeText: '8pm', endTimeText: '1am' })).toEqual({});
    expect(validateEvent({ startTimeText: '8pm', endTimeText: '20:00' }).endTime).toMatch(/matches/);
  });

  it('limits lengths and checks the date', () => {
    expect(validateEvent({ name: 'x'.repeat(81) }).name).toBeTruthy();
    expect(validateEvent({ notes: 'x'.repeat(1001) }).notes).toBeTruthy();
    expect(validateEvent({ date: '2027-02-30' }).date).toBeTruthy();
    expect(validateEvent({ date: '2027-02-28' })).toEqual({});
  });
});

describe('website schedule from events', () => {
  const mehndi = event({
    kind: EventKind.MEHNDI,
    date: '2027-05-07',
    startTime: '18:00',
    venueName: 'The Courtyard',
    dressCode: 'Bright colours',
    notes: 'Bring an appetite',
  });
  const ceremony = event({ kind: EventKind.CEREMONY, date: '2027-05-08', startTime: '16:00' });

  it('makes one item per event, in date order, keyed by event', () => {
    const items = eventsToWebsiteSchedule([ceremony, mehndi]);
    expect(items.map((item) => item.name)).toEqual(['Mehndi', 'Ceremony']);
    expect(items[0]).toMatchObject({
      id: `item_from_${mehndi.id}`,
      date: '2027-05-07',
      place: 'The Courtyard',
      notes: 'Dress code: Bright colours\n\nBring an appetite',
    });
  });

  it('refreshes items from events, keeps hand-written ones and drops deleted events', () => {
    const handWritten = { id: 'item_1', name: 'After-party', place: 'The bar' };
    const stale = { id: 'item_from_event_gone', name: 'Old event' };
    const edited = { id: `item_from_${mehndi.id}`, name: 'Mehndi (old time)' };

    const merged = mergeWebsiteSchedule([edited, handWritten, stale], [mehndi, ceremony]);
    expect(merged.map((item) => item.name)).toEqual(['Mehndi', 'After-party', 'Ceremony']);
  });

  it('is the same when used twice, and respects the section limit', () => {
    const once = mergeWebsiteSchedule([], [mehndi, ceremony]);
    expect(mergeWebsiteSchedule(once, [mehndi, ceremony])).toEqual(once);
    expect(mergeWebsiteSchedule([{ id: 'item_1', name: 'Mine' }], [mehndi, ceremony], 2)).toHaveLength(2);
  });
});

describe('per-event answers (F1)', () => {
  const going = createGuest({ firstName: 'A', rsvpStatus: RsvpStatus.ATTENDING });
  const quiet = createGuest({ firstName: 'B' });

  it('prefers the answer for this event over the wedding-wide one', () => {
    const brunch = event({ attendance: { [going.id]: 'declined', [quiet.id]: 'attending' } });
    expect(guestEventStatus(brunch, going)).toBe(RsvpStatus.DECLINED);
    expect(guestEventStatus(brunch, quiet)).toBe(RsvpStatus.ATTENDING);
    expect(guestEventStatus(event({}), going)).toBe(RsvpStatus.ATTENDING);
    expect(eventGuestSummary(brunch, [going, quiet])).toEqual({
      invited: 2,
      attending: 1,
      declined: 1,
      awaiting: 0,
    });
  });

  it('ignores answers from guests no longer on the event', () => {
    const smaller = event({
      guestScope: GuestScope.INVITED,
      invitedGuestIds: [quiet.id],
      attendance: { [going.id]: 'attending' },
    });
    expect(eventGuestSummary(smaller, [going, quiet])).toEqual({
      invited: 1,
      attending: 0,
      declined: 0,
      awaiting: 1,
    });
  });
});
