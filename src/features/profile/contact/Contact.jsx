import React, { useMemo, useState } from 'react';
import { Linking } from 'react-native';
import { useRouter } from 'expo-router';

import {
  EmptyState,
  PageHeader,
  Screen,
  SectionHeader,
  Stack,
  Text,
  TextField,
  useToast,
} from '@/design-system/components';
import { Routes } from '@/navigation/routes';

import { ContactFilters } from './components/ContactFilters';
import { ContactRow } from './components/ContactRow';
import { ContactSummary } from './components/ContactSummary';
import { useContacts } from './hooks/useContacts';
import { CONTACT_COPY, ContactFilter } from './lib/contactConstants';
import { countContactMethods } from './lib/contactHelpers';

export function Contact() {
  const router = useRouter();
  const toast = useToast();
  const [filter, setFilter] = useState(ContactFilter.ALL);
  const [query, setQuery] = useState('');
  const { contacts, wedding } = useContacts({ filter, query });
  const methods = useMemo(() => countContactMethods(contacts), [contacts]);

  const openLink = async (url) => {
    try {
      await Linking.openURL(url);
    } catch {
      toast.error(CONTACT_COPY.openError);
    }
  };

  if (!wedding) {
    // If the wedding workspace isn't set up yet, show an empty state prompting the user to set it up.
    return (
      <Screen>
        <Stack gap="lg">
          <PageHeader
            eyebrow={CONTACT_COPY.eyebrow}
            title={CONTACT_COPY.title}
            subtitle={CONTACT_COPY.subtitle}
          />
          <EmptyState
            icon="guests"
            title="Set up your wedding first"
            message="Your vendor address book will be ready with your wedding workspace."
            actionLabel="Go to setup"
            onAction={() => router.push(Routes.onboarding)}
          />
        </Stack>
      </Screen>
    );
  }

  return (
    // The main contact list screen, showing a summary, search/filter controls, and the list of contacts or an empty state.
    <Screen>
      <Stack gap="lg" testID="profile-contacts">
        <PageHeader
          eyebrow={CONTACT_COPY.eyebrow}
          title={CONTACT_COPY.title}
          subtitle={CONTACT_COPY.subtitle}
        />
        {/* Show a summary of the number of contacts and available contact methods. */}
        <ContactSummary contactCount={contacts.length} methods={methods} />

        <Stack gap="sm">
          <SectionHeader
            eyebrow="Find someone"
            title="Vendor contacts"
            subtitle={`${contacts.length} ${contacts.length === 1 ? 'contact' : 'contacts'}`}
          />
          <TextField
            label={CONTACT_COPY.searchLabel}
            value={query}
            onChangeText={setQuery}
            placeholder={CONTACT_COPY.searchPlaceholder}
            icon="search"
            autoCapitalize="none"
          />
          <ContactFilters value={filter} onChange={setFilter} />
        </Stack>
        {/* Show the list of contacts if there are any, otherwise an empty state based on the current search and filter. */}
        {contacts.length > 0 ? (
          <Stack gap="sm">
            {contacts.map((contact) => (
              <ContactRow
                key={contact.id}
                contact={contact}
                onOpen={(item) => router.push(Routes.bookingDetail(item.id))}
                onEmail={(item) => openLink(`mailto:${item.email}`)}
                onCall={(item) => openLink(`tel:${item.phone}`)}
                onWebsite={(item) => {
                  const website = /^https?:\/\//i.test(item.website)
                    ? item.website
                    : `https://${item.website}`;
                  openLink(website);
                }}
              />
            ))}
          </Stack>
        ) : (
          <EmptyState
            icon="guests"
            compact
            title={query || filter !== ContactFilter.ALL ? CONTACT_COPY.noResultsTitle : CONTACT_COPY.emptyTitle}
            message={query || filter !== ContactFilter.ALL ? CONTACT_COPY.noResultsMessage : CONTACT_COPY.emptyMessage}
            actionLabel={
              query || filter !== ContactFilter.ALL ? 'Clear search and filters' : 'Browse bookings'
            }
            onAction={
              query || filter !== ContactFilter.ALL
                ? () => {
                    setQuery('');
                    setFilter(ContactFilter.ALL);
                  }
                : () => router.push(Routes.bookingTracker)
            }
          />
        )}

        {contacts.length > 0 && methods.website === 0 ? (
          <Text variant="caption" color="subtle">
            Add a website to a vendor booking to see it here.
          </Text>
        ) : null}
      </Stack>
    </Screen>
  );
}

export default Contact;
