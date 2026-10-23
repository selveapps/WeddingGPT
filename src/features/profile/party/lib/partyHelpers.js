import { PARTY_COPY, PARTY_ROLES, PARTY_SIDES } from './partyConstants';

export function validatePartyMember(values = {}) {
  const errors = {};
  const name = typeof values.name === 'string' ? values.name.trim() : '';
  const email = typeof values.email === 'string' ? values.email.trim() : '';
  const note = typeof values.note === 'string' ? values.note.trim() : '';

  if (!name) errors.name = PARTY_COPY.nameRequired;
  else if (name.length > 80) errors.name = PARTY_COPY.nameTooLong;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = PARTY_COPY.invalidEmail;
  if (note.length > 300) errors.note = PARTY_COPY.noteTooLong;
  if (!PARTY_ROLES.some((role) => role.value === values.role)) errors.role = 'Choose a role.';
  if (!PARTY_SIDES.some((side) => side.value === values.side))
    errors.side = 'Choose who they are connected to.';

  return { isValid: Object.keys(errors).length === 0, errors };
}

export function sortPartyMembers(members = []) {
  return [...members].sort((a, b) => {
    const roleCompare = (a.role ?? '').localeCompare(b.role ?? '');
    return roleCompare || (a.name ?? '').localeCompare(b.name ?? '');
  });
}

export function searchPartyMembers(members = [], query = '') {
  const term = String(query).trim().toLocaleLowerCase();
  if (!term) return [...members];
  return members.filter((member) =>
    [
      member.name,
      member.email,
      member.phone,
      member.note,
      partyRoleLabel(member.role),
      partySideLabel(member.side),
    ].some((value) =>
      String(value ?? '')
        .toLocaleLowerCase()
        .includes(term)
    )
  );
}

export function summariseParty(members = []) {
  return {
    total: members.length,
    withContact: members.filter((member) => Boolean(member.email || member.phone)).length,
    roles: new Set(members.map((member) => member.role).filter(Boolean)).size,
  };
}

export function partyRoleLabel(value) {
  return PARTY_ROLES.find((role) => role.value === value)?.label ?? 'Wedding party';
}

export function partySideLabel(value) {
  return PARTY_SIDES.find((side) => side.value === value)?.label ?? 'Shared';
}
