import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';

import {
  Screen,
  Stack,
  Row,
  Text,
  Card,
  Chip,
  Button,
  TextField,
  ProgressBar,
  AnimatedNumber,
  SectionHeader,
  EmptyState,
  BottomSheet,
  ListRow,
  ConfirmSheet,
  useToast,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { Routes } from '@/navigation/routes';
import {
  useGuestStore,
  selectAllGuests,
  selectAllHouseholds,
} from '@/store';
import {
  summariseRsvps,
  guestFullName,
  RsvpStatus,
  RSVP_STATUS_META,
  InvitationStatus,
  INVITATION_STATUS_META,
} from '@/models';
import { GuestRow } from '@/features/guests/GuestRow';

/**
 * Guests tab (PRD s.9).
 *
 * RSVP counts sit above the list and are derived on render, so a status changed
 * on a detail screen is reflected the instant you come back - s.9 asks for
 * exactly that, and a cached counter is how it usually fails.
 *
 * Selection mode is entered by long-pressing a guest. Bulk RSVP and bulk
 * invitation updates are the two operations that are genuinely painful one at a
 * time once a list passes about thirty people.
 */
const RSVP_FILTERS = [
  { key: 'all', label: 'Everyone' },
  { key: RsvpStatus.ATTENDING, label: 'Attending' },
  { key: RsvpStatus.PENDING, label: 'Awaiting' },
  { key: RsvpStatus.DECLINED, label: 'Declined' },
  { key: RsvpStatus.MAYBE, label: 'Maybe' },
];

export default function GuestsScreen() {
  const router = useRouter();
  const toast = useToast();
  const { spacing } = useTheme();

  const guests = useGuestStore(selectAllGuests);
  const households = useGuestStore(selectAllHouseholds);
  const bulkUpdate = useGuestStore((state) => state.bulkUpdate);
  const bulkDelete = useGuestStore((state) => state.bulkDelete);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const selecting = selectedIds.length > 0;

  const householdNameById = useMemo(
    () => new Map(households.map((household) => [household.id, household.name])),
    [households]
  );

  const rsvps = useMemo(() => summariseRsvps(guests), [guests]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return guests
      .filter((guest) => {
        if (filter !== 'all' && guest.rsvpStatus !== filter) return false;
        if (!needle) return true;
        const haystack = [
          guestFullName(guest),
          guest.email ?? '',
          guest.phone ?? '',
          householdNameById.get(guest.householdId) ?? '',
          ...(guest.tags ?? []),
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(needle);
      })
      .sort((a, b) => guestFullName(a).localeCompare(guestFullName(b)));
  }, [guests, filter, query, householdNameById]);

  const toggleSelect = (guest) => {
    setSelectedIds((current) =>
      current.includes(guest.id)
        ? current.filter((id) => id !== guest.id)
        : [...current, guest.id]
    );
  };

  const applyBulk = (patch, message) => {
    bulkUpdate(selectedIds, patch);
    setBulkOpen(false);
    setSelectedIds([]);
    toast.success(message);
  };

  const handleBulkDelete = () => {
    const count = selectedIds.length;
    bulkDelete(selectedIds);
    setConfirmDelete(false);
    setBulkOpen(false);
    setSelectedIds([]);
    toast.info(`${count} ${count === 1 ? 'guest' : 'guests'} removed`);
  };

  // --- Empty ---------------------------------------------------------------
  if (guests.length === 0) {
    return (
      <Screen bottomInset={spacing.xxl}>
        <Stack gap="lg">
          <Stack gap="xxs">
            <Text variant="eyebrow" color="subtle">
              Guests
            </Text>
            <Text variant="h1" heading>
              Your guest list
            </Text>
          </Stack>

          <EmptyState
            icon="guests"
            title="No guests yet"
            message="Start with the people you are certain about. You can group them into households and track RSVPs as replies come in."
            actionLabel="Add a guest"
            onAction={() => router.push(Routes.guestAdd)}
          />
        </Stack>
      </Screen>
    );
  }

  return (
    <Screen
      bottomInset={spacing.xxl}
      footer={
        selecting ? (
          <Row gap="xs">
            <Button
              label="Cancel"
              variant="secondary"
              style={{ flex: 1 }}
              onPress={() => setSelectedIds([])}
            />
            <Button
              label={`Update ${selectedIds.length}`}
              iconLeft="edit"
              style={{ flex: 1 }}
              onPress={() => setBulkOpen(true)}
            />
          </Row>
        ) : (
          <Button
            label="Add a guest"
            iconLeft="plus"
            onPress={() => router.push(Routes.guestAdd)}
          />
        )
      }
    >
      <Stack gap="lg">
        <Stack gap="xxs">
          <Text variant="eyebrow" color="subtle">
            Guests
          </Text>
          <Text variant="h1" heading>
            Your guest list
          </Text>
          {households.length > 0 ? (
            <Text variant="bodySm" color="muted">
              {guests.length} people across {households.length}{' '}
              {households.length === 1 ? 'household' : 'households'}
            </Text>
          ) : null}
        </Stack>

        {/* --- RSVP snapshot ------------------------------------------------ */}
        <Card tone="raised">
          <Stack gap="md">
            <Row gap="lg">
              <Figure value={rsvps.attendingHeadcount} label="attending" />
              <Figure value={rsvps.awaiting} label="awaiting reply" />
              <Figure value={rsvps.declined} label="declined" />
            </Row>

            <ProgressBar
              value={rsvps.responseRate}
              tone="success"
              label="Replies in"
              valueLabel={`${rsvps.responded} of ${rsvps.total}`}
            />

            {rsvps.plusOnesConfirmed > 0 ? (
              <Text variant="caption" color="subtle">
                Headcount includes {rsvps.plusOnesConfirmed} confirmed{' '}
                {rsvps.plusOnesConfirmed === 1 ? 'plus one' : 'plus ones'}.
              </Text>
            ) : null}
          </Stack>
        </Card>

        {/* --- Search and filter -------------------------------------------- */}
        <Stack gap="xs">
          <TextField
            label="Search"
            value={query}
            onChangeText={setQuery}
            placeholder="Name, household, email or tag"
            icon={query ? 'close' : 'search'}
            onIconPress={() => setQuery('')}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Row gap="xs" wrap align="flex-start">
            {RSVP_FILTERS.map((entry) => (
              <Chip
                key={entry.key}
                label={entry.label}
                size="sm"
                selected={filter === entry.key}
                onPress={() => setFilter(entry.key)}
              />
            ))}
          </Row>
        </Stack>

        {/* --- The list ------------------------------------------------------ */}
        <Stack gap="xs">
          <SectionHeader
            eyebrow={selecting ? `${selectedIds.length} selected` : 'Everyone'}
            title={`${visible.length} ${visible.length === 1 ? 'guest' : 'guests'}`}
            subtitle={selecting ? 'Tap to select more, or update them together.' : undefined}
          />

          {visible.length === 0 ? (
            <EmptyState
              compact
              icon="search"
              title="Nobody matches"
              message="Try a different search or filter."
              actionLabel="Clear filters"
              onAction={() => {
                setQuery('');
                setFilter('all');
              }}
            />
          ) : (
            <Stack gap="none">
              {visible.map((guest) => (
                <GuestRow
                  key={guest.id}
                  guest={guest}
                  householdName={householdNameById.get(guest.householdId)}
                  selected={selectedIds.includes(guest.id)}
                  onToggleSelect={selecting ? toggleSelect : undefined}
                  onPress={() => router.push(Routes.guestDetail(guest.id))}
                />
              ))}
            </Stack>
          )}
        </Stack>

        {!selecting && visible.length > 1 ? (
          <Button
            label="Select several"
            variant="ghost"
            iconLeft="check"
            onPress={() => setSelectedIds([visible[0].id])}
          />
        ) : null}
      </Stack>

      {/* --- Bulk actions --------------------------------------------------- */}
      <BottomSheet
        visible={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title={`Update ${selectedIds.length} ${selectedIds.length === 1 ? 'guest' : 'guests'}`}
        subtitle="The same change is applied to everyone selected."
      >
        <Stack gap="lg">
          <Stack gap="xs">
            <Text variant="eyebrow" color="subtle">
              Set RSVP to
            </Text>
            {Object.entries(RSVP_STATUS_META).map(([value, meta]) => (
              <ListRow
                key={value}
                title={meta.label}
                showChevron={false}
                onPress={() =>
                  applyBulk(
                    {
                      rsvpStatus: value,
                      rsvpRespondedAt:
                        value === RsvpStatus.PENDING || value === RsvpStatus.NO_RESPONSE
                          ? null
                          : new Date().toISOString(),
                    },
                    `RSVP set to ${meta.label.toLowerCase()}`
                  )
                }
              />
            ))}
          </Stack>

          <Stack gap="xs">
            <Text variant="eyebrow" color="subtle">
              Set invitation to
            </Text>
            {Object.entries(INVITATION_STATUS_META).map(([value, meta]) => (
              <ListRow
                key={value}
                title={meta.label}
                showChevron={false}
                onPress={() =>
                  applyBulk(
                    {
                      invitationStatus: value,
                      ...(value === InvitationStatus.INVITED
                        ? { invitationSentAt: new Date().toISOString() }
                        : {}),
                    },
                    `Marked as ${meta.label.toLowerCase()}`
                  )
                }
              />
            ))}
          </Stack>

          <Button
            label="Remove these guests"
            variant="ghost"
            iconLeft="trash"
            onPress={() => setConfirmDelete(true)}
          />
        </Stack>
      </BottomSheet>

      <ConfirmSheet
        visible={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleBulkDelete}
        title={`Remove ${selectedIds.length} ${selectedIds.length === 1 ? 'guest' : 'guests'}?`}
        message="They will be taken off your list along with their RSVP and meal preference. This cannot be undone."
        confirmLabel="Remove"
        destructive
        icon="trash"
      />
    </Screen>
  );
}

/** One of the three counts in the RSVP snapshot. */
function Figure({ value, label }) {
  return (
    <Stack gap="hair">
      <AnimatedNumber value={value} variant="numeric" />
      <Text variant="caption" color="subtle">
        {label}
      </Text>
    </Stack>
  );
}
