import { Linking, Platform } from 'react-native';
import * as Contacts from 'expo-contacts/legacy';

/**
 * The phone's address book, read once when a couple chooses to import guests.
 *
 * Permission is asked for only at that moment, never on launch. Nothing is
 * kept from the address book except what the couple ticks and imports - the
 * full list lives in memory on the import screen and is gone when it closes.
 *
 * Every failure resolves to `{ error }` rather than throwing, with copy that
 * tells the person what to do next.
 */

export const CONTACTS_SUPPORTED = Platform.OS === 'ios' || Platform.OS === 'android';

export const ContactsError = {
  DENIED: 'denied',
  UNSUPPORTED: 'unsupported',
  UNAVAILABLE: 'unavailable',
};

const ERROR_COPY = {
  [ContactsError.DENIED]: 'Contacts access is off for WeddingGPT. Allow it in Settings to import guests.',
  [ContactsError.UNSUPPORTED]: 'Importing contacts works in the iPhone and Android apps.',
  [ContactsError.UNAVAILABLE]: 'Could not read your contacts just now. Try again in a moment.',
};

export function contactsErrorMessage(code) {
  return ERROR_COPY[code] ?? ERROR_COPY[ContactsError.UNAVAILABLE];
}

export function openContactsSettings() {
  return Linking.openSettings().catch(() => {});
}

/** Digits only, minus a leading US country code, so "+1 (512) 555-0101" matches "512-555-0101". */
export function normalisePhone(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
}

function pickPrimary(entries = [], key) {
  const primary = entries.find((entry) => entry?.isPrimary && entry[key]) ?? entries.find((entry) => entry?.[key]);
  return primary?.[key]?.trim() || null;
}

/** Split a display name when the address book has no structured first/last name. */
function splitName(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return { firstName: parts[0] ?? '', lastName: '' };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] };
}

/** One address-book entry as a guest-shaped object, or null if it has no usable name. */
function toGuestContact(contact) {
  let firstName = contact.firstName?.trim() ?? '';
  let lastName = contact.lastName?.trim() ?? '';
  if (!firstName && !lastName) ({ firstName, lastName } = splitName(contact.name ?? ''));
  if (!firstName && !lastName) return null;
  if (contact.contactType === Contacts.ContactTypes?.Company) return null;

  return {
    id: contact.id,
    firstName: firstName || lastName,
    lastName: firstName ? lastName : '',
    phone: pickPrimary(contact.phoneNumbers, 'number'),
    email: pickPrimary(contact.emails, 'email'),
  };
}

/**
 * Ask for access (if needed) and read every person in the address book.
 * Resolves to `{ contacts, limited }` or `{ error }`, where `limited` is true
 * when iOS has granted access to a hand-picked subset only.
 */
export async function loadDeviceContacts() {
  if (!CONTACTS_SUPPORTED) return { error: ContactsError.UNSUPPORTED };

  try {
    const permission = await Contacts.requestPermissionsAsync();
    if (permission.status !== 'granted') return { error: ContactsError.DENIED };

    const { data } = await Contacts.getContactsAsync({
      fields: [
        Contacts.Fields.FirstName,
        Contacts.Fields.LastName,
        Contacts.Fields.Name,
        Contacts.Fields.PhoneNumbers,
        Contacts.Fields.Emails,
      ],
      sort: Contacts.SortTypes.FirstName,
    });

    const contacts = (data ?? [])
      .map(toGuestContact)
      .filter(Boolean)
      .sort((a, b) =>
        `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, undefined, {
          sensitivity: 'base',
        })
      );

    return { contacts, limited: permission.accessPrivileges === 'limited' };
  } catch (error) {
    if (__DEV__) console.warn('[contacts] Could not load contacts', error);
    return { error: ContactsError.UNAVAILABLE };
  }
}

/**
 * iOS 18+ limited access: let the person add more people to what WeddingGPT
 * can see. Resolves once the system picker closes.
 */
export async function expandLimitedAccess() {
  if (Platform.OS !== 'ios') return;
  try {
    await Contacts.presentAccessPickerAsync();
  } catch {
    // Older iOS has no access picker; Settings is the fallback.
    await openContactsSettings();
  }
}

/**
 * Is this contact already a guest? Matched on phone, then email, then exact
 * full name - so re-running an import does not create duplicates.
 */
export function buildGuestMatcher(guests = []) {
  const phones = new Set();
  const emails = new Set();
  const names = new Set();

  for (const guest of guests) {
    const phone = normalisePhone(guest.phone);
    if (phone.length >= 7) phones.add(phone);
    if (guest.email) emails.add(guest.email.trim().toLowerCase());
    names.add(`${guest.firstName ?? ''} ${guest.lastName ?? ''}`.trim().toLowerCase());
  }

  return (contact) => {
    const phone = normalisePhone(contact.phone);
    if (phone.length >= 7 && phones.has(phone)) return true;
    if (contact.email && emails.has(contact.email.toLowerCase())) return true;
    return names.has(`${contact.firstName} ${contact.lastName}`.trim().toLowerCase());
  };
}
