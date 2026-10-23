import {
  partyRoleLabel,
  partySideLabel,
  normalisePartyMember,
  filterPartyMembers,
  filterPartyByContact,
  filterPartyMembersByRole,
  searchPartyMembers,
  sortPartyMembers,
  summariseParty,
  validatePartyMember,
} from '../partyHelpers';

const valid = { name: 'Mina', role: 'attendant', side: 'both', email: '', phone: '', note: '' };

describe('wedding party helpers', () => {
  it('validates names, contact details, roles and side', () => {
    expect(validatePartyMember(valid).isValid).toBe(true);
    expect(validatePartyMember({ ...valid, email: 'not-an-email' }).errors.email).toBeTruthy();
    expect(validatePartyMember({ ...valid, role: 'unknown' }).errors.role).toBeTruthy();
  });

  it('normalises contact strings before saving a roster member', () => {
    expect(
      normalisePartyMember({
        ...valid,
        name: ' Mina ',
        email: ' MINA@Example.COM ',
        phone: ' 555-0100 ',
        note: ' Reading ',
      })
    ).toMatchObject({
      name: 'Mina',
      email: 'mina@example.com',
      phone: '555-0100',
      note: 'Reading',
    });
  });

  it('sorts a copy by role and name', () => {
    const list = [
      { ...valid, name: 'Zoe', role: 'reader' },
      { ...valid, name: 'Ana' },
    ];
    expect(sortPartyMembers(list).map((member) => member.name)).toEqual(['Ana', 'Zoe']);
    expect(list[0].name).toBe('Zoe');
  });

  it('summarises distinct roles and available contacts', () => {
    expect(summariseParty([valid, { ...valid, role: 'reader', email: 'reader@example.com' }])).toEqual({
      total: 2,
      withContact: 1,
      roles: 2,
    });
  });

  it('searches names and contact details without changing the source list', () => {
    const members = [
      { ...valid, name: 'Mina', email: 'mina@example.com' },
      { ...valid, name: 'Ravi', phone: '555-0199', note: 'Ceremony reading' },
    ];
    expect(searchPartyMembers(members, 'MINA')).toEqual([members[0]]);
    expect(searchPartyMembers(members, 'reading')).toEqual([members[1]]);
    expect(searchPartyMembers(members, '  ')).toEqual(members);
    expect(members).toHaveLength(2);
  });

  it('filters by partner side and supports the everyone view', () => {
    const members = [
      { ...valid, name: 'Mina', side: 'partner-one' },
      { ...valid, name: 'Ravi', side: 'partner-two' },
    ];
    expect(filterPartyMembers(members, 'partner-one')).toEqual([members[0]]);
    expect(filterPartyMembers(members)).toEqual(members);
    expect(members).toHaveLength(2);
  });

  it('filters by role and returns all roles for the default view', () => {
    const members = [
      { ...valid, name: 'Mina', role: 'attendant' },
      { ...valid, name: 'Ravi', role: 'reader' },
    ];
    expect(filterPartyMembersByRole(members, 'reader')).toEqual([members[1]]);
    expect(filterPartyMembersByRole(members)).toEqual(members);
  });

  it('filters people who have missing or known contact methods', () => {
    const members = [
      { ...valid, name: 'Mina', email: 'mina@example.com' },
      { ...valid, name: 'Ravi', email: '', phone: '' },
    ];
    expect(filterPartyByContact(members, 'with-contact')).toEqual([members[0]]);
    expect(filterPartyByContact(members, 'missing-contact')).toEqual([members[1]]);
    expect(filterPartyByContact(members)).toEqual(members);
  });

  it('provides friendly labels for recognised and unknown values', () => {
    expect(partyRoleLabel('reader')).toBe('Reader');
    expect(partySideLabel('partner-two')).toBe('Partner two');
    expect(partyRoleLabel('unknown')).toBe('Wedding party');
  });
});
