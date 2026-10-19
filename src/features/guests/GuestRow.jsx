import React from 'react';

import { Row, Stack, Text, Badge, Avatar, Touchable, Icon } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import {
  guestFullName,
  RSVP_STATUS_META,
  PlusOneStatus,
  MEAL_PREFERENCE_META,
  MealPreference,
} from '@/models';

/**
 * One guest in a list.
 *
 * The RSVP badge is the only status shown by default: it is the one the couple
 * is scanning for. Meal and plus-one appear underneath only when they carry
 * information, so a list of two hundred people stays readable rather than
 * becoming a spreadsheet - which PRD s.27 explicitly warns against.
 *
 * When `onToggleSelect` is supplied, both a tap and a long press toggle
 * selection instead of opening the guest. Without it, a tap calls `onPress`.
 *
 * @param {object} props
 * @param {object} props.guest Guest record to display and pass to callbacks.
 * @param {string} [props.householdName] Optional household label shown with the guest.
 * @param {(guest: object) => void} [props.onPress] Opens the guest when selection is disabled.
 * @param {boolean} [props.selected=false] Whether the row is currently selected.
 * @param {(guest: object) => void} [props.onToggleSelect] Enables tap/long-press selection.
 */
export function GuestRow({ guest, householdName, onPress, selected, onToggleSelect }) {
  const { colors, spacing, borderWidths } = useTheme();

  const name = guestFullName(guest) || 'Unnamed guest';
  const rsvp = RSVP_STATUS_META[guest.rsvpStatus] ?? RSVP_STATUS_META.pending;

  const details = [
    householdName,
    guest.plusOneStatus === PlusOneStatus.CONFIRMED
      ? `Plus one${guest.plusOneName ? `: ${guest.plusOneName}` : ''}`
      : guest.plusOneStatus === PlusOneStatus.ALLOWED
        ? 'Plus one allowed'
        : null,
    guest.mealPreference && guest.mealPreference !== MealPreference.UNSPECIFIED
      ? MEAL_PREFERENCE_META[guest.mealPreference]?.label
      : null,
  ].filter(Boolean);

  return (
    <Touchable
      onPress={() => (onToggleSelect ? onToggleSelect(guest) : onPress?.(guest))}
      onLongPress={onToggleSelect ? () => onToggleSelect(guest) : undefined}
      scaleOnPress={false}
      haptic="light"
      accessibilityLabel={`${name}. ${rsvp.label}.`}
      accessibilityState={onToggleSelect ? { selected: Boolean(selected) } : undefined}
      style={{
        paddingVertical: spacing.sm,
        borderBottomWidth: borderWidths.hairline,
        borderBottomColor: colors.border,
        backgroundColor: selected ? colors.brandSoft : 'transparent',
      }}
    >
      <Row gap="sm" align="center">
        {onToggleSelect && selected ? (
          <Avatar icon="check" tone="brand" size="md" />
        ) : (
          <Avatar name={name} size="md" icon={guest.isChild ? 'user' : 'user'} />
        )}

        <Stack gap="hair" style={{ flex: 1 }}>
          <Text variant="body" numberOfLines={1}>
            {name}
          </Text>
          {details.length > 0 ? (
            <Text variant="caption" color="subtle" numberOfLines={1}>
              {details.join(' · ')}
            </Text>
          ) : null}
        </Stack>

        <Badge label={rsvp.label} tone={rsvp.tone} />

        {onToggleSelect ? null : <Icon name="chevronRight" size="sm" color="inkSubtle" />}
      </Row>
    </Touchable>
  );
}

export default GuestRow;
