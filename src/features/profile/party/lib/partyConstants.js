export const PARTY_FIELD = 'profilePartyRoster';

export const PARTY_ROLES = [
  { value: 'honor-attendant', label: 'Honor attendant' },
  { value: 'attendant', label: 'Wedding party' },
  { value: 'family', label: 'Family' },
  { value: 'officiant', label: 'Officiant' },
  { value: 'reader', label: 'Reader' },
  { value: 'helper', label: 'Day-of helper' },
];

export const PARTY_SIDES = [
  { value: 'partner-one', label: 'Partner one' },
  { value: 'partner-two', label: 'Partner two' },
  { value: 'both', label: 'Shared' },
];

export const PARTY_COPY = {
  nameRequired: 'Add a name for this person.',
  nameTooLong: 'Keep names to 80 characters or fewer.',
  invalidEmail: 'Enter a valid email address, or leave it blank.',
  noteTooLong: 'Keep notes to 300 characters or fewer.',
};
