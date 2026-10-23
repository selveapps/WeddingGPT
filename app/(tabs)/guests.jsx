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
  PageHeader,
} from '@/design-system/components';
import { useTheme, useBreakpoint } from '@/design-system/theme';
import { Routes } from '@/navigation/routes';
import { useGuestStore, selectAllGuests, selectAllHouseholds } from '@/store';
import {
  summariseRsvps,
  guestFullName,
  RsvpStatus,
  RSVP_STATUS_META,
  InvitationStatus,
  INVITATION_STATUS_META,
} from '@/models';
import { GuestRow } from '@/features/guests/GuestRow';
import { GuestTable } from '@/features/guests/GuestTable';
import { GuestColumn, sortGuests } from '@/features/guests/lib/guestTable';
import { NotificationBell } from '@/features/notifications/NotificationBell';

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
 *
 * On a wide screen the list becomes a sortable table with a checkbox column
 * (`GuestTable`), because there the job is comparing and fixing many guests.
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
  const { isWide } = useBreakpoint();

  const guests = useGuestStore(selectAllGuests);
  const households = useGuestStore(selectAllHouseholds);
  const bulkUpdate = useGuestStore((state) => state.bulkUpdate);
  const bulkDelete = useGuestStore((state) => state.bulkDelete);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sort, setSort] = useState({ column: GuestColumn.NAME, direction: 'asc' });

  const selecting = selectedIds.length > 0;

  const householdNameById = useMemo(
    () => new Map(households.map((household) => [household.id, household.name])),
    [households]
  );

  const rsvps = useMemo(() => summariseRsvps(guests), [guests]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return guests.filter((guest) => {
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
    });
  }, [guests, filter, query, householdNameById]);

  const sorted = useMemo(
    () => sortGuests(visible, isWide ? sort : { column: GuestColumn.NAME }, householdNameById),
    [visible, isWide, sort, householdNameById]
  );

  const toggleSelect = (guest) => {
    setSelectedIds((current) =>
      current.includes(guest.id) ? current.filter((id) => id !== guest.id) : [...current, guest.id]
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
        <Stack gap="xl">
          <PageHeader eyebrow="Guests" title="Your guest list" trailing={<NotificationBell />} />

          <EmptyState
            icon="guests"
            title="No guests yet"
            message="Bring people in from your phone's contacts, or add them one by one. You can group them into households and track RSVPs as replies come in."
            actionLabel="Import from contacts"
            onAction={() => router.push(Routes.guestImport)}
            secondaryActionLabel="Add a guest by hand"
            onSecondaryAction={() => router.push(Routes.guestAdd)}
          />

          <Button
            label="Import a spreadsheet"
            variant="ghost"
            iconLeft="plus"
            onPress={() => router.push(Routes.guestSpreadsheet)}
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
          <Row gap="xs">
            <Button
              label="Import"
              variant="secondary"
              iconLeft="userPlus"
              style={{ flex: 1 }}
              onPress={() => router.push(Routes.guestImport)}
              accessibilityHint="Pick guests from your phone's contacts"
            />
            <Button
              label="Add guest"
              iconLeft="plus"
              style={{ flex: 1 }}
              onPress={() => router.push(Routes.guestAdd)}
            />
          </Row>
        )
      }
    >
      <Stack gap="xl">
        <PageHeader
          eyebrow="Guests"
          title="Your guest list"
          subtitle={
            households.length > 0
              ? `${guests.length} people across ${households.length} ${households.length === 1 ? 'household' : 'households'}`
              : `${guests.length} ${guests.length === 1 ? 'person' : 'people'} so far`
          }
          trailing={<NotificationBell />}
        />

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
        <Stack gap="sm">
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
          ) : isWide ? (
            <GuestTable
              guests={sorted}
              householdNameById={householdNameById}
              sort={sort}
              onSortChange={setSort}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onOpen={(guest) => router.push(Routes.guestDetail(guest.id))}
            />
          ) : (
            <Stack gap="none">
              {sorted.map((guest) => (
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

        {!selecting && !isWide && visible.length > 1 ? (
          <Button
            label="Select several"
            variant="ghost"
            iconLeft="check"
            onPress={() => setSelectedIds([sorted[0].id])}
          />
        ) : null}

        <Card padding="none">
          <ListRow
            icon="guests"
            title="Seating chart"
            subtitle="Tables, auto-seating and who to keep apart"
            onPress={() => router.push(Routes.guestSeating)}
          />
          <ListRow
            icon="vendors"
            title="Meals for the caterer"
            subtitle="Plates, meal choices and allergies to check"
            onPress={() => router.push(Routes.guestMeals)}
          />
          <ListRow
            icon="userPlus"
            title="Wedding party"
            subtitle="Roles, jobs, outfits and a list to send each person"
            onPress={() => router.push(Routes.guestParty)}
          />
          <ListRow
            icon="star"
            title="Gifts and thank-yous"
            subtitle="Log gifts and write every note on time"
            onPress={() => router.push(Routes.guestGifts)}
          />
          <ListRow
            icon="heart"
            title="Wedding website"
            subtitle="Schedule, travel, registry and FAQ for your guests"
            onPress={() => router.push(Routes.guestWebsite)}
          />
          <ListRow
            icon="send"
            title="RSVP website"
            subtitle="Send each household a link; replies fill in your list"
            onPress={() => router.push(Routes.guestRsvp)}
          />
          <ListRow
            icon="note"
            title="Spreadsheet"
            subtitle="Import guests from a CSV, or export your list for the caterer"
            onPress={() => router.push(Routes.guestSpreadsheet)}
          />
        </Card>
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
                inset={false}
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
                inset={false}
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
