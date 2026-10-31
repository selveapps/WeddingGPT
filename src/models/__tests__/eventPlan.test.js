import { MealPreference, PlusOneStatus, RsvpStatus } from '@/models';

import { PLAN_MAX_TABLES, buildEventPlan, escapeHtml, eventPlanHtml, eventPlanText } from '../eventPlan';

const guest = (id, fields = {}) => ({
  id,
  firstName: id,
  rsvpStatus: RsvpStatus.ATTENDING,
  mealPreference: MealPreference.STANDARD,
  ...fields,
});

const guests = [
  guest('Ana', { plusOneStatus: PlusOneStatus.CONFIRMED, dietaryNotes: 'Peanut allergy' }),
  guest('Ben'),
  guest('Cam', { rsvpStatus: RsvpStatus.PENDING }),
  guest('Dee'),
];

const mehndi = {
  id: 'ev1',
  kind: 'mehndi',
  name: 'Mehndi',
  date: '2027-02-12',
  startTime: '16:00',
  endTime: '21:00',
  venueName: 'The Rose Garden',
  address: '12 Park Lane',
  dressCode: 'Bright colours',
  notes: 'Henna artist arrives at 3.',
  guestScope: 'invited',
  invitedGuestIds: ['Ana', 'Ben', 'Cam'],
  attendance: { Ben: 'declined' },
};

const runOfShow = [
  { id: 'r2', eventId: 'ev1', title: 'Henna', start: 17 * 60, durationMin: 120, owner: 'Artist' },
  { id: 'r1', eventId: 'ev1', title: 'Guests arrive', start: 16 * 60, durationMin: 30, location: 'Lawn' },
  { id: 'r3', eventId: null, title: 'Ceremony', start: 16 * 60, durationMin: 30 },
];

const tables = [
  { id: 't1', eventId: 'ev1', name: 'Family', capacity: 8, guestIds: ['Ana', 'gone'] },
  { id: 't2', eventId: null, name: 'Table 1', capacity: 8, guestIds: ['Dee'] },
];

const vendors = [
  {
    id: 'v1',
    name: 'Spice Route',
    contactName: 'Raj',
    categoryKey: 'catering',
    status: 'booked',
    phone: '555-0101',
  },
  { id: 'v2', name: 'Maybe Films', categoryKey: 'videography', status: 'saved', phone: '555-0102' },
  { id: 'v3', name: 'No Number DJs', categoryKey: 'music', status: 'booked' },
];

const party = [
  { id: 'p1', name: 'Priya', roleKey: 'maid_of_honor', phone: '555-0199', email: '' },
  { id: 'p2', name: 'Quiet', roleKey: 'other', phone: '', email: '' },
];

const plan = (event = mehndi) => buildEventPlan({ event, guests, tables, runOfShow, vendors, party });

describe('buildEventPlan', () => {
  it('gathers when and where for the event', () => {
    const result = plan();
    expect(result.name).toBe('Mehndi');
    expect(result.date).toContain('February 12');
    expect(result.when).toBe('4:00 PM - 9:00 PM');
    expect(result.venue).toBe('The Rose Garden');
    expect(result.dressCode).toBe('Bright colours');
  });

  it("counts this event's guests and plates, not the wedding's", () => {
    const result = plan();
    // Ben declined the mehndi; Dee is not invited to it.
    expect(result.guests).toEqual({ invited: 3, attending: 1, declined: 1, awaiting: 1 });
    expect(result.catering.headcount).toBe(2); // Ana and her plus-one
    expect(result.catering.allergens).toEqual([{ label: 'Nuts', guests: ['Ana'] }]);
  });

  it("lists this event's run of show in time order, and its own tables", () => {
    const result = plan();
    expect(result.schedule.map((item) => item.title)).toEqual(['Guests arrive', 'Henna']);
    expect(result.schedule[0]).toEqual({
      time: '4:00 PM - 4:30 PM',
      title: 'Guests arrive',
      details: 'Lawn',
    });
    expect(result.seating).toEqual([{ name: 'Family', capacity: 8, guests: ['Ana'] }]);
  });

  it('lists booked vendors and party members who can be reached', () => {
    expect(plan().contacts).toEqual([
      expect.objectContaining({ name: 'Priya', phone: '555-0199' }),
      { name: 'Spice Route (Raj)', role: 'Catering', phone: '555-0101', email: '' },
    ]);
  });

  it('without an event, is the wedding day', () => {
    const result = buildEventPlan({ wedding: { date: '2027-02-13' }, guests, tables, runOfShow });
    expect(result.name).toBe('Wedding day');
    expect(result.date).toContain('February 13');
    expect(result.schedule.map((item) => item.title)).toEqual(['Ceremony']);
    expect(result.seating.map((table) => table.name)).toEqual(['Table 1']);
    expect(result.guests.invited).toBe(4);
  });

  it('leaves very large charts off the page with a count', () => {
    const many = Array.from({ length: PLAN_MAX_TABLES + 2 }, (_, i) => ({
      id: `t${i}`,
      eventId: null,
      name: `Table ${i}`,
      capacity: 8,
      guestIds: [],
    }));
    const result = buildEventPlan({ tables: many });
    expect(result.seating).toHaveLength(PLAN_MAX_TABLES);
    expect(result.tablesLeftOff).toBe(2);
  });
});

describe('eventPlanText', () => {
  it('reads as one message to send', () => {
    const text = eventPlanText(plan());
    expect(text.split('\n').slice(0, 4)).toEqual([
      'Mehndi',
      expect.stringContaining('4:00 PM - 9:00 PM'),
      'The Rose Garden, 12 Park Lane',
      'Dress code: Bright colours',
    ]);
    expect(text).toContain('1 guest attending of 3 invited, 1 still to answer');
    expect(text).toContain('4:00 PM - 4:30 PM  Guests arrive (Lawn)');
    expect(text).toContain('Nuts: Ana');
    expect(text).toContain('Family: Ana');
    expect(text).toContain('Spice Route (Raj) - Catering: 555-0101');
    expect(text).toContain('Henna artist arrives at 3.');
  });
});

describe('eventPlanHtml', () => {
  it('is a whole page with every section', () => {
    const html = eventPlanHtml(plan(), { title: "Priya and Sam's wedding" });
    expect(html.startsWith('<!doctype html>')).toBe(true);
    for (const heading of ['Schedule', 'Catering', 'Seating', 'Contacts', 'Notes']) {
      expect(html).toContain(`<h2>${heading}</h2>`);
    }
    expect(html).toContain('Priya and Sam&#39;s wedding');
  });

  it('escapes what the couple typed', () => {
    const html = eventPlanHtml(plan({ ...mehndi, name: '<script>alert(1)</script>', notes: 'A & B' }));
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('A &amp; B');
    expect(escapeHtml('"x"')).toBe('&quot;x&quot;');
  });

  it('leaves out sections with nothing in them', () => {
    const html = eventPlanHtml(buildEventPlan({ event: { ...mehndi, notes: '' } }));
    expect(html).not.toContain('<h2>Schedule</h2>');
    expect(html).not.toContain('<h2>Seating</h2>');
    expect(html).not.toContain('<h2>Notes</h2>');
  });
});
