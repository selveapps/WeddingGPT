import React, { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  Screen,
  Stack,
  Row,
  Text,
  Card,
  Badge,
  Button,
  Chip,
  TextField,
  Divider,
  ScreenHeader,
  SectionHeader,
  BottomSheet,
  ConfirmSheet,
  EmptyState,
  useToast,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { Routes } from '@/navigation/routes';
import { useGuestStore, selectAllGuests } from '@/store';
import { summariseRsvps, InvitationStatus, INVITATION_STATUS_META } from '@/models';
import { formatMediumDate } from '@/lib/date';
import { GuestRow } from '@/features/guests/GuestRow';

/**
 * One household (PRD s.9, "household list").
 *
 * Invitation status lives here rather than on the guest, because invitations go
 * to addresses. Marking the household invited marks everyone in it, which is
 * both what actually happened and one tap instead of five.
 */
export default function HouseholdDetailScreen() {
  const router = useRouter();
  const toast = useToast();
  const { spacing } = useTheme();
  const { id } = useLocalSearchParams();

  const householdId = String(id);
  const household = useGuestStore((state) => state.households.byId[householdId] ?? null);
  const guests = useGuestStore(selectAllGuests);
  const updateHousehold = useGuestStore((state) => state.updateHousehold);
  const deleteHousehold = useGuestStore((state) => state.deleteHousehold);
  const bulkUpdate = useGuestStore((state) => state.bulkUpdate);

  const [editOpen, setEditOpen] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftAddress, setDraftAddress] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const members = useMemo(
    () => guests.filter((guest) => guest.householdId === householdId),
    [guests, householdId]
  );

  const rsvps = useMemo(() => summariseRsvps(members), [members]);

  if (!household) {
    return (
      <Screen>
        <Stack gap="lg">
          <ScreenHeader eyebrow="Guests" title="Household" />
          <EmptyState
            icon="home"
            title="This household is gone"
            message="It was removed, or the link is out of date."
            actionLabel="Back to the guest list"
            onAction={() => router.replace(Routes.guests)}
          />
        </Stack>
      </Screen>
    );
  }

  const invitation = INVITATION_STATUS_META[household.invitationStatus] ?? {};

  const setInvitation = (status) => {
    const sentAt = status === InvitationStatus.NOT_SENT ? null : new Date().toISOString();
    updateHousehold(household.id, { invitationStatus: status, invitationSentAt: sentAt });
    // Everyone at the address received the same invitation, so their individual
    // status has to follow - otherwise the guest list and the household disagree.
    bulkUpdate(
      members.map((guest) => guest.id),
      { invitationStatus: status }
    );
    toast.success(`Marked as ${(INVITATION_STATUS_META[status]?.label ?? status).toLowerCase()}`);
  };

  const saveDetails = () => {
    updateHousehold(household.id, {
      name: draftName.trim() || household.name,
      address: draftAddress.trim(),
    });
    setEditOpen(false);
    toast.success('Household updated');
  };

  const handleDelete = () => {
    // `deleteHousehold` un-parents its members rather than deleting them - see
    // the store. Nobody disappears from the guest list because an address did.
    deleteHousehold(household.id);
    setConfirmDelete(false);
    toast.info(`${household.name} removed`);
    router.back();
  };

  return (
    <Screen
      bottomInset={spacing.xxl}
      footer={
        <Button
          label="Add someone here"
          iconLeft="plus"
          onPress={() => router.push({ pathname: Routes.guestAdd, params: { householdId } })}
        />
      }
    >
      <Stack gap="lg">
        <ScreenHeader
          eyebrow="Guests"
          title={household.name}
          actionIcon="edit"
          actionLabel="Edit this household"
          onActionPress={() => {
            setDraftName(household.name);
            setDraftAddress(household.address ?? '');
            setEditOpen(true);
          }}
        />

        <Stack gap="sm">
          <Text variant="h1" heading>
            {household.name}
          </Text>
          {household.address ? (
            <Text variant="body" color="muted">
              {household.address}
            </Text>
          ) : null}
        </Stack>

        {/* --- Summary ------------------------------------------------------ */}
        <Card tone="muted">
          <Row justify="space-between" align="center">
            <Stack gap="hair">
              <Text variant="h4">
                {members.length} {members.length === 1 ? 'person' : 'people'}
              </Text>
              <Text variant="bodySm" color="muted">
                {rsvps.attending} attending · {rsvps.awaiting} awaiting
              </Text>
            </Stack>
            <Badge label={invitation.label ?? 'Not invited'} tone={invitation.tone ?? 'neutral'} />
          </Row>
        </Card>

        {/* --- Invitation --------------------------------------------------- */}
        <Stack gap="xs">
          <SectionHeader
            eyebrow="The invitation"
            title="Where it has got to"
            subtitle={
              household.invitationSentAt
                ? `Last updated ${formatMediumDate(household.invitationSentAt.slice(0, 10))}`
                : 'Nothing sent yet.'
            }
          />
          <Row gap="xs" wrap align="flex-start">
            {Object.entries(INVITATION_STATUS_META).map(([value, meta]) => (
              <Chip
                key={value}
                label={meta.label}
                size="sm"
                selected={household.invitationStatus === value}
                onPress={() => setInvitation(value)}
              />
            ))}
          </Row>
        </Stack>

        {/* --- Members ------------------------------------------------------ */}
        <Stack gap="xs">
          <SectionHeader eyebrow="Who is in it" title="Members" />

          {members.length === 0 ? (
            <EmptyState
              compact
              icon="guests"
              title="Nobody here yet"
              message="Add the people who share this invitation."
              actionLabel="Add someone"
              onAction={() =>
                router.push({ pathname: Routes.guestAdd, params: { householdId } })
              }
            />
          ) : (
            <Stack gap="none">
              {members.map((guest) => (
                <GuestRow
                  key={guest.id}
                  guest={guest}
                  onPress={() => router.push(Routes.guestDetail(guest.id))}
                />
              ))}
            </Stack>
          )}
        </Stack>

        <Divider />

        <Button
          label="Remove this household"
          variant="ghost"
          iconLeft="trash"
          onPress={() => setConfirmDelete(true)}
        />
      </Stack>

      {/* --- Edit --------------------------------------------------------- */}
      <BottomSheet
        visible={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit household"
        footer={<Button label="Save" onPress={saveDetails} />}
      >
        <Stack gap="md">
          <TextField
            label="Household name"
            value={draftName}
            onChangeText={setDraftName}
            placeholder="The Kapoors"
            autoCapitalize="words"
          />
          <TextField
            label="Address"
            value={draftAddress}
            onChangeText={setDraftAddress}
            placeholder="Where the invitation goes"
            multiline
            numberOfLines={3}
            autoCapitalize="words"
          />
        </Stack>
      </BottomSheet>

      <ConfirmSheet
        visible={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title={`Remove ${household.name}?`}
        message={
          members.length > 0
            ? `The ${members.length} ${members.length === 1 ? 'person' : 'people'} in it stay on your guest list - they just will not be grouped any more.`
            : 'This household will be removed.'
        }
        confirmLabel="Remove"
        destructive
        icon="trash"
      />
    </Screen>
  );
}
