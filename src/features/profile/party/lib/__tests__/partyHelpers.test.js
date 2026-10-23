import {
  partyRoleLabel,
  partySideLabel,
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

  it('provides friendly labels for recognised and unknown values', () => {
    expect(partyRoleLabel('reader')).toBe('Reader');
    expect(partySideLabel('partner-two')).toBe('Partner two');
    expect(partyRoleLabel('unknown')).toBe('Wedding party');
  });
});
