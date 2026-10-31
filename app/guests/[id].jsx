import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  Screen,
  Stack,
  Row,
  Text,
  Card,
  Badge,
  Button,
  Avatar,
  Chip,
  ListRow,
  Divider,
  ScreenHeader,
  SectionHeader,
  ConfirmSheet,
  EmptyState,
  useToast,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { Routes } from '@/navigation/routes';
import { useGuestStore, selectGuestById, selectAllHouseholds } from '@/store';
import {
  guestFullName,
  RsvpStatus,
  RSVP_STATUS_META,
  INVITATION_STATUS_META,
  PLUS_ONE_STATUS_META,
  MEAL_PREFERENCE_META,
  MealPreference,
  PlusOneStatus,
} from '@/models';
import { formatMediumDate } from '@/lib/date';
import { GuestForm } from '@/features/guests/GuestForm';

/**
 * Guest detail (PRD s.9).
 *
 * The RSVP chips at the top are the whole point of the screen. Replies arrive
 * by text and in conversation, and the couple is usually recording one while
 * standing up - so changing an RSVP is one tap from opening the guest, not a
 * trip through an edit form.
 */
export default function GuestDetailScreen() {
  const router = useRouter();
  const toast = useToast();
  const { spacing } = useTheme();
  const { id } = useLocalSearchParams();

  const guest = useGuestStore(selectGuestById(String(id)));
  const households = useGuestStore(selectAllHouseholds);
  const setRsvp = useGuestStore((state) => state.setRsvp);
  const updateGuest = useGuestStore((state) => state.updateGuest);
  const deleteGuest = useGuestStore((state) => state.deleteGuest);

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!guest) {
    return (
      <Screen>
        <Stack gap="lg">
          <ScreenHeader eyebrow="Guests" title="Guest" />
          <EmptyState
            icon="guests"
            title="This guest is gone"
            message="They were removed, or the link is out of date."
            actionLabel="Back to the guest list"
            onAction={() => router.replace(Routes.guests)}
          />
        </Stack>
      </Screen>
    );
  }

  const name = guestFullName(guest) || 'Unnamed guest';
  const household = households.find((entry) => entry.id === guest.householdId);
  const rsvp = RSVP_STATUS_META[guest.rsvpStatus] ?? RSVP_STATUS_META.pending;
  const invitation = INVITATION_STATUS_META[guest.invitationStatus] ?? {};
  const plusOne = PLUS_ONE_STATUS_META[guest.plusOneStatus] ?? {};

  const handleSave = (values) => {
    updateGuest(guest.id, values);
    setEditing(false);
    toast.success('Saved');
  };

  const handleDelete = () => {
    deleteGuest(guest.id);
    setConfirmDelete(false);
    toast.info(`${name} removed`);
    router.back();
  };

  if (editing) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Screen bottomInset={spacing.xxl}>
          <Stack gap="lg">
            <ScreenHeader
              eyebrow="Guests"
              title={`Edit ${name}`}
              onBack={() => setEditing(false)}
              backLabel="Stop editing"
            />

            <GuestForm
              initial={guest}
              households={households}
              submitLabel="Save changes"
              onSubmit={handleSave}
              onCancel={() => setEditing(false)}
            />
          </Stack>
        </Screen>
      </KeyboardAvoidingView>
    );
  }

  return (
    <Screen
      bottomInset={spacing.xxl}
      footer={<Button label="Edit details" iconLeft="edit" onPress={() => setEditing(true)} />}
    >
      <Stack gap="lg">
        <ScreenHeader
          eyebrow={household?.name ?? 'Guests'}
          title="Guest"
          actionIcon="edit"
          actionLabel="Edit this guest"
          onActionPress={() => setEditing(true)}
        />

        {/* --- Identity ----------------------------------------------------- */}
        <Row gap="md" align="center">
          <Avatar name={name} size="lg" />
          <Stack gap="hair" style={{ flex: 1 }}>
            <Text variant="h1" heading>
              {name}
            </Text>
            {household ? (
              <Text
                variant="bodySm"
                color="brand"
                onPress={() => router.push(Routes.householdDetail(household.id))}
              >
                {household.name}
              </Text>
            ) : (
              <Text variant="bodySm" color="subtle">
                Not in a household
              </Text>
            )}
          </Stack>
        </Row>

        {/* --- RSVP --------------------------------------------------------- */}
        <Stack gap="sm">
          <SectionHeader
            eyebrow="Their reply"
            title="RSVP"
            subtitle={
              guest.rsvpRespondedAt
                ? `Replied ${formatMediumDate(guest.rsvpRespondedAt.slice(0, 10))}`
                : 'No reply recorded yet.'
            }
          />

          <Row gap="xs" wrap align="flex-start">
            {Object.entries(RSVP_STATUS_META).map(([value, meta]) => (
              <Chip
                key={value}
                label={meta.label}
                selected={guest.rsvpStatus === value}
                onPress={() => {
                  setRsvp(guest.id, value);
                  toast.success(
                    value === RsvpStatus.ATTENDING
                      ? `${guest.firstName} is coming`
                      : `Marked as ${meta.label.toLowerCase()}`
                  );
                }}
              />
            ))}
          </Row>
        </Stack>

        {/* --- Facts -------------------------------------------------------- */}
        <Card padding="none">
          <ListRow
            icon="mail"
            title="Email"
            showChevron={false}
            trailing={
              <Text variant="body" color={guest.email ? 'muted' : 'subtle'}>
                {guest.email || 'Not known'}
              </Text>
            }
          />
          <ListRow
            icon="phone"
            title="Phone"
            showChevron={false}
            trailing={
              <Text variant="body" color={guest.phone ? 'muted' : 'subtle'}>
                {guest.phone || 'Not known'}
              </Text>
            }
          />
          <ListRow
            icon="mail"
            title="Invitation"
            showChevron={false}
            trailing={<Badge label={invitation.label ?? 'Not invited'} tone={invitation.tone ?? 'neutral'} />}
          />
          <ListRow
            icon="user"
            title="Plus one"
            showChevron={false}
            trailing={
              <Text variant="body" color="muted">
                {guest.plusOneStatus === PlusOneStatus.CONFIRMED && guest.plusOneName
                  ? guest.plusOneName
                  : plusOne.label ?? 'No plus one'}
              </Text>
            }
          />
          <ListRow
            icon="note"
            title="Meal"
            showChevron={false}
            trailing={
              <Text
                variant="body"
                color={guest.mealPreference === MealPreference.UNSPECIFIED ? 'subtle' : 'muted'}
              >
                {MEAL_PREFERENCE_META[guest.mealPreference]?.label ?? 'Not specified'}
              </Text>
            }
          />
          {guest.isChild ? (
            <ListRow
              icon="star"
              title="Child"
              showChevron={false}
              trailing={<Badge label="Yes" tone="info" />}
            />
          ) : null}
        </Card>

        {guest.dietaryNotes ? (
          <Stack gap="xs">
            <Text variant="eyebrow" color="subtle">
              Dietary notes
            </Text>
            <Card tone="muted">
              <Text variant="body" color="muted">
                {guest.dietaryNotes}
              </Text>
            </Card>
          </Stack>
        ) : null}

        {guest.tags?.length > 0 ? (
          <Stack gap="xs">
            <Text variant="eyebrow" color="subtle">
              Tags
            </Text>
            <Row gap="xs" wrap align="flex-start">
              {guest.tags.map((tag) => (
                <Chip key={tag} label={tag} size="sm" />
              ))}
            </Row>
          </Stack>
        ) : null}

        {guest.notes ? (
          <Stack gap="xs">
            <Text variant="eyebrow" color="subtle">
              Notes
            </Text>
            <Card tone="muted">
              <Text variant="body" color="muted">
                {guest.notes}
              </Text>
            </Card>
          </Stack>
        ) : null}

        <Divider />

        <Button
          label="Remove this guest"
          variant="ghost"
          iconLeft="trash"
          onPress={() => setConfirmDelete(true)}
        />
      </Stack>

      <ConfirmSheet
        visible={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title={`Remove ${name}?`}
        message="They will be taken off your list along with their RSVP and meal preference. This cannot be undone."
        confirmLabel="Remove"
        destructive
        icon="trash"
      />
    </Screen>
  );
}
