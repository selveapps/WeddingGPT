import {
  GuestField,
  buildImportPreview,
  guessMapping,
  guestsToCsv,
  importDrafts,
  mappingHasName,
  parseInvitation,
  parseMeal,
  parsePlusOne,
  parseRsvp,
  parseTags,
  readGuestCsv,
  splitFullName,
  summariseImportPreview,
} from '../guestCsv';
import {
  InvitationStatus,
  MealPreference,
  PlusOneStatus,
  RsvpStatus,
  createGuest,
  createHousehold,
} from '@/models';

const F = GuestField;

describe('guessMapping', () => {
  it('recognises common header names', () => {
    expect(
      guessMapping([
        'First Name',
        'Surname',
        'E-mail',
        'Mobile',
        'RSVP',
        'Meal choice',
        'Allergies',
        'Party',
        'Shoe size',
      ])
    ).toEqual([
      F.FIRST_NAME,
      F.LAST_NAME,
      F.EMAIL,
      F.PHONE,
      F.RSVP,
      F.MEAL,
      F.DIETARY,
      F.HOUSEHOLD,
      F.IGNORE,
    ]);
  });

  it('uses a single name column when there are no split names', () => {
    expect(guessMapping(['Name', 'Email'])).toEqual([F.FULL_NAME, F.EMAIL]);
  });

  it('prefers split names over a full-name column', () => {
    expect(guessMapping(['Name', 'First name', 'Last name'])).toEqual([F.IGNORE, F.FIRST_NAME, F.LAST_NAME]);
  });

  it('maps each field at most once', () => {
    expect(guessMapping(['Email', 'Email'])).toEqual([F.EMAIL, F.IGNORE]);
  });

  it('knows whether a mapping can import names', () => {
    expect(mappingHasName([F.FULL_NAME])).toBe(true);
    expect(mappingHasName([F.FIRST_NAME, F.EMAIL])).toBe(true);
    expect(mappingHasName([F.EMAIL, F.LAST_NAME])).toBe(false);
  });
});

describe('value parsing', () => {
  it('reads RSVP words people type', () => {
    expect(parseRsvp('Yes')).toEqual({ value: RsvpStatus.ATTENDING });
    expect(parseRsvp(' accepted ')).toEqual({ value: RsvpStatus.ATTENDING });
    expect(parseRsvp('Regrets')).toEqual({ value: RsvpStatus.DECLINED });
    expect(parseRsvp('maybe')).toEqual({ value: RsvpStatus.MAYBE });
    expect(parseRsvp('Awaiting reply')).toEqual({ value: RsvpStatus.PENDING });
    expect(parseRsvp('')).toEqual({ value: RsvpStatus.PENDING });
    expect(parseRsvp('perhaps later')).toEqual({ error: 'RSVP "perhaps later" not recognised' });
  });

  it('keeps unknown meals as Other with the original word', () => {
    expect(parseMeal('Veg')).toEqual({ value: MealPreference.VEGETARIAN });
    expect(parseMeal('GF')).toEqual({ value: MealPreference.GLUTEN_FREE });
    expect(parseMeal('Pescatarian')).toEqual({ value: MealPreference.OTHER, note: 'Pescatarian' });
  });

  it('reads plus ones, invitations and tags', () => {
    expect(parsePlusOne('Plus one confirmed')).toBe(PlusOneStatus.CONFIRMED);
    expect(parsePlusOne('yes')).toBe(PlusOneStatus.ALLOWED);
    expect(parsePlusOne('')).toBe(PlusOneStatus.NOT_ALLOWED);
    expect(parseInvitation('Save the date sent')).toBe(InvitationStatus.SAVE_THE_DATE_SENT);
    expect(parseInvitation('sent')).toBe(InvitationStatus.INVITED);
    expect(parseInvitation('')).toBe(InvitationStatus.NOT_SENT);
    expect(parseTags("Bride's side; college | work")).toEqual(["Bride's side", 'college', 'work']);
  });

  it('splits a full name on the last word', () => {
    expect(splitFullName('Meera Shah')).toEqual({ firstName: 'Meera', lastName: 'Shah' });
    expect(splitFullName('Mary Ann Lee')).toEqual({ firstName: 'Mary Ann', lastName: 'Lee' });
    expect(splitFullName('Cher')).toEqual({ firstName: 'Cher', lastName: '' });
    expect(splitFullName('  ')).toEqual({ firstName: '', lastName: '' });
  });
});

describe('buildImportPreview', () => {
  const csv = [
    'Name,Email,RSVP,Meal,Household,Plus one name',
    'Meera Shah,meera@example.com,Yes,Veg,The Shahs,',
    'Ravi Shah,,yes,Pescatarian,the shahs,Anika',
    ',nobody@example.com,,,,',
    'Sam Lee,sam@,maybe,,,',
    'Jo Park,jo@example.com,perhaps,,,',
    'Meera Shah,MEERA@example.com,no,,,',
  ].join('\n');

  const preview = () => {
    const { rows, mapping } = readGuestCsv(csv);
    return buildImportPreview(rows, mapping);
  };

  it('turns rows into drafts with line numbers', () => {
    const [meera, ravi] = preview().rows;
    expect(meera).toMatchObject({ line: 2, status: 'ready', household: 'The Shahs', errors: [] });
    expect(meera.draft).toMatchObject({
      firstName: 'Meera',
      lastName: 'Shah',
      email: 'meera@example.com',
      rsvpStatus: RsvpStatus.ATTENDING,
      mealPreference: MealPreference.VEGETARIAN,
    });
    expect(ravi.draft).toMatchObject({
      mealPreference: MealPreference.OTHER,
      dietaryNotes: 'Meal: Pescatarian',
      plusOneName: 'Anika',
      plusOneStatus: PlusOneStatus.CONFIRMED,
    });
  });

  it('marks rows with problems as errors, with readable reasons', () => {
    const rows = preview().rows;
    expect(rows[2]).toMatchObject({ status: 'error', errors: ['No name'] });
    expect(rows[3].errors).toEqual(['Email "sam@" looks incomplete']);
    expect(rows[4].errors).toEqual(['RSVP "perhaps" not recognised']);
  });

  it('flags a guest repeated in the file, by email ignoring case', () => {
    expect(preview().rows[5].status).toBe('duplicate');
  });

  it('flags guests already on the list, by email or by name', () => {
    const { rows, mapping } = readGuestCsv(
      'Name,Email\nMeera Shah,meera@example.com\nRavi Shah,\nNew Person,'
    );
    const existing = [
      createGuest({ firstName: 'Meera', email: 'Meera@Example.com' }),
      createGuest({ firstName: 'Ravi', lastName: 'Shah' }),
    ];
    expect(buildImportPreview(rows, mapping, { existingGuests: existing }).rows.map((r) => r.status)).toEqual(
      ['duplicate', 'duplicate', 'ready']
    );
  });

  it('strips the formula guard from our own exports', () => {
    const { rows, mapping } = readGuestCsv("Name,Phone\nAna Diaz,'+44 20 7946 0000");
    expect(buildImportPreview(rows, mapping).rows[0].draft.phone).toBe('+44 20 7946 0000');
  });

  it('summarises counts and distinct households', () => {
    expect(summariseImportPreview(preview())).toEqual({
      ready: 2,
      duplicate: 1,
      error: 3,
      total: 6,
      households: 1,
    });
  });

  it('can read a file without a header row', () => {
    const rows = [['Meera', 'Shah']];
    const result = buildImportPreview(rows, [F.FIRST_NAME, F.LAST_NAME], { hasHeader: false });
    expect(result.rows[0]).toMatchObject({ line: 1, status: 'ready' });
  });
});

describe('importDrafts', () => {
  it('reuses households by name, creates missing ones and adds ready guests only', () => {
    const existing = createHousehold({ weddingId: 'w', name: 'The Shahs' });
    const { rows, mapping } = readGuestCsv(
      'Name,Household\nMeera Shah,the shahs\nSam Lee,The Lees\nJo Lee,THE LEES\n,Nobody'
    );
    const preview = buildImportPreview(rows, mapping);

    const created = [];
    const addHousehold = jest.fn((input) => {
      const household = createHousehold(input);
      created.push(household);
      return household;
    });
    const addGuests = jest.fn((inputs) => inputs.map(createGuest));

    const guests = importDrafts(preview, { weddingId: 'w', households: [existing], addHousehold, addGuests });

    expect(addHousehold).toHaveBeenCalledTimes(1);
    expect(created[0]).toMatchObject({ name: 'The Lees', weddingId: 'w' });
    expect(guests.map((g) => [g.firstName, g.householdId])).toEqual([
      ['Meera', existing.id],
      ['Sam', created[0].id],
      ['Jo', created[0].id],
    ]);
    expect(guests.every((g) => g.weddingId === 'w')).toBe(true);
  });
});

describe('guestsToCsv', () => {
  const household = createHousehold({ weddingId: 'w', name: 'The Shahs' });
  const guests = [
    createGuest({ firstName: 'Zed', lastName: 'Loose' }),
    createGuest({
      firstName: 'Meera',
      lastName: 'Shah',
      householdId: household.id,
      email: 'meera@example.com',
      phone: '+44 20 7946 0000',
      rsvpStatus: RsvpStatus.ATTENDING,
      mealPreference: MealPreference.VEGAN,
      dietaryNotes: 'nuts, shellfish',
      plusOneStatus: PlusOneStatus.CONFIRMED,
      plusOneName: 'Anika',
      isChild: false,
      invitationStatus: InvitationStatus.INVITED,
      tags: ['family', 'mehndi'],
      notes: '=cmd',
    }),
  ];

  it('writes readable labels, households first, and guards formulas', () => {
    const lines = guestsToCsv(guests, [household]).split('\n');
    expect(lines[0]).toBe(
      'First name,Last name,Household,Email,Phone,RSVP,Meal,Dietary notes,Plus one,Plus-one name,Child,Invitation,Tags,Notes'
    );
    expect(lines[1]).toBe(
      'Meera,Shah,The Shahs,meera@example.com,\'+44 20 7946 0000,Attending,Vegan,"nuts, shellfish",Plus one confirmed,Anika,,Invited,family; mehndi,\'=cmd'
    );
    expect(lines[2].startsWith('Zed,Loose,,')).toBe(true);
  });

  it('imports back exactly what it exported', () => {
    const { rows, mapping } = readGuestCsv(guestsToCsv(guests, [household]));
    expect(mapping).not.toContain(F.IGNORE);
    const [meera] = buildImportPreview(rows, mapping).rows;
    expect(meera.household).toBe('The Shahs');
    expect(meera.draft).toEqual({
      firstName: 'Meera',
      lastName: 'Shah',
      email: 'meera@example.com',
      phone: '+44 20 7946 0000',
      rsvpStatus: RsvpStatus.ATTENDING,
      mealPreference: MealPreference.VEGAN,
      dietaryNotes: 'nuts, shellfish',
      plusOneStatus: PlusOneStatus.CONFIRMED,
      plusOneName: 'Anika',
      isChild: false,
      invitationStatus: InvitationStatus.INVITED,
      tags: ['family', 'mehndi'],
      notes: '=cmd',
    });
  });
});
