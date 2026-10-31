import {
  CUE_LIMITS,
  dayContacts,
  dayDate,
  findContact,
  liveDay,
  minutesOfDay,
  phoneUrl,
  upcomingCues,
} from '../liveDay';

const item = (id, start, durationMin, owner = '') => ({ id, title: id, start, durationMin, owner });

const day = [
  item('Ceremony', 960, 30, 'Officiant'),
  item('Cocktail hour', 990, 60, 'Caterer'),
  item('Photos', 990, 45, 'Photographer'),
  item('First dance', 1200, 0, 'DJ'),
];

describe('liveDay', () => {
  it('says what is on now, what is next and in how long', () => {
    const live = liveDay(day, 1000);
    expect(live.current.map((i) => i.id)).toEqual(['Photos', 'Cocktail hour']);
    expect(live.next.id).toBe('First dance');
    expect(live.startsIn).toBe(200);
    expect(live).toMatchObject({ done: 1, total: 4, finished: false });
  });

  it('counts down to the first item before the day starts', () => {
    expect(liveDay(day, 900)).toMatchObject({ current: [], startsIn: 60, done: 0 });
    expect(liveDay(day, 900).next.id).toBe('Ceremony');
  });

  it('keeps an item with no duration on for its starting minute', () => {
    expect(liveDay(day, 1200).current.map((i) => i.id)).toEqual(['First dance']);
    expect(liveDay(day, 1201)).toMatchObject({ current: [], next: null, done: 4, finished: true });
  });

  it('is never finished with nothing planned', () => {
    expect(liveDay([], 600).finished).toBe(false);
  });
});

describe('findContact', () => {
  const vendors = [
    { name: 'Spice Route', categoryKey: 'catering', status: 'quoted', phone: '555 0101' },
    { name: 'Saffron Kitchen', categoryKey: 'catering', status: 'booked', phone: '555 0102' },
    { name: 'Beats by Dev', contactName: 'Dev', categoryKey: 'music', status: 'booked', phone: '555 0103' },
    { name: 'Lens & Light', categoryKey: 'photography', status: 'declined', phone: '555 0104' },
    { name: 'Petal Co', categoryKey: 'florals', status: 'booked', phone: '' },
  ];
  const party = [
    { name: 'Asha', roleKey: 'maid_of_honor', phone: '555 0201' },
    { name: 'Rohan', roleKey: 'usher', phone: '555 0202' },
  ];
  const find = (owner) => findContact(owner, { vendors, party })?.name ?? null;

  it('prefers the booked vendor in the category the owner describes', () => {
    expect(find('Caterer')).toBe('Saffron Kitchen');
    expect(find('DJ')).toBe('Beats by Dev');
  });

  it('matches someone named in the owner, vendor or party', () => {
    expect(find('Spice Route team')).toBe('Spice Route');
    expect(find('Dev')).toBe('Beats by Dev');
    expect(find('Asha and the girls')).toBe('Asha');
  });

  it('matches party roles, plurals included', () => {
    expect(find('Ushers')).toBe('Rohan');
    expect(find('Maid of honour')).toBe('Asha');
  });

  it('skips declined vendors and anyone without a number', () => {
    expect(find('Photographer')).toBeNull();
    expect(find('Florist')).toBeNull();
    expect(find('')).toBeNull();
  });

  it('does not match a name inside another word', () => {
    expect(find('Development team')).toBeNull();
  });

  it('lists each person to call once, with what they run', () => {
    const rows = dayContacts(
      [
        item('Dinner', 1080, 90, 'Caterer'),
        item('Ceremony', 960, 30, 'Ushers'),
        item('Bar', 1170, 60, 'Bar'),
      ],
      { vendors, party }
    );
    expect(rows.map((row) => [row.name, row.items])).toEqual([
      ['Rohan', ['Ceremony']],
      ['Saffron Kitchen', ['Dinner', 'Bar']],
    ]);
  });
});

it('makes a tel: link from a typed number', () => {
  expect(phoneUrl('+44 (0)20 7946-0018')).toBe('tel:+4402079460018');
  expect(phoneUrl('ask at desk')).toBeNull();
});

it("finds the day's date and the clock's minutes", () => {
  expect(dayDate({ event: { date: '2027-02-12' }, wedding: { date: '2027-02-14' } })).toBe('2027-02-12');
  expect(dayDate({ event: null, wedding: { date: '2027-02-14' } })).toBe('2027-02-14');
  expect(dayDate({ event: { date: null }, wedding: { date: '2027-02-14' } })).toBeNull();
  expect(minutesOfDay(new Date(2027, 1, 14, 16, 30))).toBe(990);
});

describe('upcomingCues', () => {
  const now = new Date(2027, 1, 14, 23, 0);
  const wedding = { date: '2027-02-15' };

  it('looks today and tomorrow ahead, and handles an item right after midnight', () => {
    const cues = upcomingCues({ items: [item('Late snack', 5, 15), item('Brunch', 600, 60)], wedding, now });
    expect(cues.map((cue) => [cue.date, cue.items.map((i) => i.id)])).toEqual([
      [new Date(2027, 1, 14, 23, 55), ['Late snack']],
      [new Date(2027, 1, 15, 9, 50), ['Brunch']],
    ]);
  });

  it('keeps at most the soonest few', () => {
    const many = Array.from({ length: CUE_LIMITS.max + 5 }, (_, i) => item(`x${i}`, 600 + i, 1));
    expect(upcomingCues({ items: many, wedding, now })).toHaveLength(CUE_LIMITS.max);
  });
});
