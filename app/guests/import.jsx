import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Platform, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  Screen,
  Stack,
  Row,
  Text,
  Card,
  Badge,
  Avatar,
  Button,
  Checkbox,
  Touchable,
  TextField,
  ScreenHeader,
  LoadingState,
  ErrorState,
  EmptyState,
  useToast,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { useGuestStore, useWeddingStore, selectAllGuests, selectWeddingId } from '@/store';
import {
  CONTACTS_SUPPORTED,
  ContactsError,
  buildGuestMatcher,
  contactsErrorMessage,
  expandLimitedAccess,
  loadDeviceContacts,
  openContactsSettings,
} from '@/services/contacts';
import haptics from '@/lib/haptics';

/**
 * Import guests from the phone's contacts.
 *
 * Most couples already have their guest list - it is in their phone. This lets
 * them tick people off the address book instead of typing two hundred names.
 * Anyone already on the list (matched by phone, email or name) is shown but
 * cannot be picked again, so running the import twice never duplicates guests.
 *
 * Imported guests start as "awaiting reply" with no household; both are a tap
 * away on the guest list afterwards.
 */
export default function ImportGuestsScreen() {
  const router = useRouter();
  const toast = useToast();
  const { spacing } = useTheme();

  const guests = useGuestStore(selectAllGuests);
  const addGuests = useGuestStore((state) => state.addGuests);
  const weddingId = useWeddingStore(selectWeddingId);

  const [state, setState] = useState({ status: 'loading', contacts: [], limited: false, error: null });
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(() => new Set());

  const load = useCallback(async () => {
    setState((current) => ({ ...current, status: 'loading' }));
    const result = await loadDeviceContacts();
    if (result.error) {
      setState({ status: 'error', contacts: [], limited: false, error: result.error });
      return;
    }
    setState({ status: 'ready', contacts: result.contacts, limited: result.limited, error: null });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isGuest = useMemo(() => buildGuestMatcher(guests), [guests]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return state.contacts;
    return state.contacts.filter((contact) =>
      [contact.firstName, contact.lastName, contact.phone ?? '', contact.email ?? '']
        .join(' ')
        .toLowerCase()
        .includes(needle)
    );
  }, [state.contacts, query]);

  const selectable = useMemo(() => visible.filter((contact) => !isGuest(contact)), [visible, isGuest]);
  const allVisibleSelected = selectable.length > 0 && selectable.every((contact) => selected.has(contact.id));

  const toggle = useCallback((id) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAllVisible = () => {
    haptics.selection();
    setSelected((current) => {
      const next = new Set(current);
      for (const contact of selectable) {
        if (allVisibleSelected) next.delete(contact.id);
        else next.add(contact.id);
      }
      return next;
    });
  };

  const importSelected = () => {
    const picked = state.contacts.filter((contact) => selected.has(contact.id) && !isGuest(contact));
    if (picked.length === 0) return;

    addGuests(
      picked.map((contact) => ({
        weddingId,
        firstName: contact.firstName,
        lastName: contact.lastName,
        phone: contact.phone,
        email: contact.email,
      }))
    );
    haptics.success();
    toast.success(`${picked.length} ${picked.length === 1 ? 'guest' : 'guests'} added`);
    router.back();
  };

  const count = selected.size;

  // --- Not available / loading / error --------------------------------------
  if (!CONTACTS_SUPPORTED || state.status !== 'ready') {
    return (
      <Screen>
        <Stack gap="xl">
          <ScreenHeader eyebrow="Guests" title="Import from contacts" />
          {state.status === 'loading' && CONTACTS_SUPPORTED ? (
            <LoadingState message="Opening your contacts..." />
          ) : state.error === ContactsError.DENIED ? (
            <ErrorState
              title="Contacts access is off"
              message={contactsErrorMessage(state.error)}
              retryLabel="Open Settings"
              onRetry={openContactsSettings}
            />
          ) : (
            <ErrorState
              title={CONTACTS_SUPPORTED ? 'Could not open contacts' : 'Only in the mobile app'}
              message={contactsErrorMessage(CONTACTS_SUPPORTED ? state.error : ContactsError.UNSUPPORTED)}
              onRetry={CONTACTS_SUPPORTED ? load : undefined}
            />
          )}
        </Stack>
      </Screen>
    );
  }

  return (
    <Screen
      scroll={false}
      footer={
        <Button
          label={count > 0 ? `Add ${count} ${count === 1 ? 'guest' : 'guests'}` : 'Select people to add'}
          iconLeft={count > 0 ? 'userPlus' : undefined}
          disabled={count === 0}
          onPress={importSelected}
        />
      }
    >
      <Stack gap="lg" style={{ flex: 1 }}>
        <ScreenHeader eyebrow="Guests" title="Import from contacts" />

        <Stack gap="sm">
          <TextField
            label="Search contacts"
            value={query}
            onChangeText={setQuery}
            placeholder="Name, phone or email"
            icon={query ? 'close' : 'search'}
            onIconPress={() => setQuery('')}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Row justify="space-between" align="center">
            <Text variant="bodySm" color="muted">
              {count > 0 ? `${count} selected` : `${state.contacts.length} contacts`}
            </Text>
            {selectable.length > 0 ? (
              <Touchable onPress={toggleAllVisible} hitSlop={12} accessibilityRole="button">
                <Text variant="actionSm" color="brand">
                  {allVisibleSelected ? 'Clear selection' : query ? 'Select matches' : 'Select all'}
                </Text>
              </Touchable>
            ) : null}
          </Row>
        </Stack>

        {state.limited && Platform.OS === 'ios' ? (
          <Card tone="sunken">
            <Row gap="sm">
              <Text variant="bodySm" color="muted" style={{ flex: 1 }}>
                You shared some of your contacts. Missing someone?
              </Text>
              <Button
                label="Add more"
                size="sm"
                variant="secondary"
                fullWidth={false}
                onPress={async () => {
                  await expandLimitedAccess();
                  load();
                }}
              />
            </Row>
          </Card>
        ) : null}

        {visible.length === 0 ? (
          <EmptyState
            compact
            icon="search"
            title={state.contacts.length === 0 ? 'No contacts found' : 'Nobody matches'}
            message={
              state.contacts.length === 0
                ? 'Your address book looks empty. You can still add guests by hand.'
                : 'Try a different name, number or email.'
            }
          />
        ) : (
          <FlatList
            style={{ flex: 1 }}
            data={visible}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            initialNumToRender={20}
            windowSize={9}
            contentContainerStyle={{ paddingBottom: spacing.lg }}
            renderItem={({ item }) => (
              <ContactRow
                contact={item}
                alreadyGuest={isGuest(item)}
                selected={selected.has(item.id)}
                onToggle={toggle}
              />
            )}
          />
        )}
      </Stack>
    </Screen>
  );
}

/** One address-book entry: checkbox, initials, name and the detail we will import. */
const ContactRow = React.memo(function ContactRow({ contact, alreadyGuest, selected, onToggle }) {
  const { colors, spacing, borderWidths } = useTheme();
  const name = `${contact.firstName} ${contact.lastName}`.trim();
  const detail = contact.phone ?? contact.email ?? 'No phone or email';

  return (
    <Touchable
      onPress={() => onToggle(contact.id)}
      disabled={alreadyGuest}
      scaleOnPress={false}
      haptic="selection"
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled: alreadyGuest }}
      accessibilityLabel={alreadyGuest ? `${name}, already on your guest list` : name}
      style={{
        paddingVertical: spacing.sm,
        borderBottomWidth: borderWidths.hairline,
        borderBottomColor: colors.border,
        opacity: alreadyGuest ? 0.55 : 1,
      }}
    >
      <Row gap="md">
        <View pointerEvents="none">
          <Checkbox checked={selected || alreadyGuest} disabled={alreadyGuest} label={name} />
        </View>
        <Avatar name={name} size="sm" />
        <Stack gap="hair" style={{ flex: 1 }}>
          <Text variant="body" numberOfLines={1}>
            {name}
          </Text>
          <Text variant="caption" color="subtle" numberOfLines={1}>
            {detail}
          </Text>
        </Stack>
        {alreadyGuest ? <Badge label="On your list" tone="neutral" /> : null}
      </Row>
    </Touchable>
  );
});
