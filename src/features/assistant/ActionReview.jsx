import React from 'react';

import { Chip, Icon, Row, Stack, Text, TextField, Touchable } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import {
  useBudgetStore,
  useGuestStore,
  selectAllBudgetCategories,
  selectAllGuests,
  selectBudget,
} from '@/store';
import { ExpenseCommitment, PaymentStatus, RSVP_STATUS_META, RsvpStatus, guestFullName } from '@/models';
import { formatMediumDate } from '@/lib/date';
import { MoneyField } from '@/features/shared/MoneyField';

/**
 * The editable preview for an expense or an RSVP change the assistant
 * understood on the phone (graduated from Labs assistant actions). Nothing
 * here writes anything: the sheet's confirm button does, with these values.
 */

/** An expense: what, how much, which category, and whether it is already paid. */
export function ExpenseReview({ value, onChange }) {
  const categories = useBudgetStore(selectAllBudgetCategories);
  const budget = useBudgetStore(selectBudget);
  const paid = value.paymentStatus === PaymentStatus.PAID;

  const setPaid = (next) =>
    onChange({
      ...value,
      paymentStatus: next ? PaymentStatus.PAID : PaymentStatus.UNPAID,
      commitment: next ? ExpenseCommitment.COMMITTED : value.commitment,
      paidAmount: next ? value.amount : 0,
    });

  return (
    <Stack gap="md">
      <TextField
        label="What is it?"
        value={value.title ?? ''}
        onChangeText={(title) => onChange({ ...value, title })}
      />
      <MoneyField
        label="Amount"
        value={value.amount ?? null}
        currency={budget?.currency}
        onChange={(amount) =>
          onChange({ ...value, amount: amount ?? 0, paidAmount: paid ? (amount ?? 0) : 0 })
        }
      />
      <Row gap="xs" wrap align="flex-start">
        <Chip label="Not paid yet" size="sm" selected={!paid} onPress={() => setPaid(false)} />
        <Chip label="Already paid" size="sm" selected={paid} onPress={() => setPaid(true)} />
      </Row>
      {categories.length ? (
        <Stack gap="xs">
          <Text variant="label">Category</Text>
          <Row gap="xs" wrap align="flex-start">
            <Chip
              label="Uncategorised"
              size="sm"
              selected={!value.budgetCategoryId}
              onPress={() => onChange({ ...value, budgetCategoryId: null })}
            />
            {categories.map((category) => (
              <Chip
                key={category.id}
                label={category.name}
                size="sm"
                selected={value.budgetCategoryId === category.id}
                onPress={() => onChange({ ...value, budgetCategoryId: category.id })}
              />
            ))}
          </Row>
        </Stack>
      ) : null}
      {value.dueDate || value.date ? (
        <Text variant="caption" color="subtle">
          {value.date ? `Paid on ${formatMediumDate(value.date)}` : `Due ${formatMediumDate(value.dueDate)}`}
        </Text>
      ) : null}
    </Stack>
  );
}

const RSVP_CHOICES = [RsvpStatus.ATTENDING, RsvpStatus.DECLINED, RsvpStatus.MAYBE];

/** An RSVP change: who (removable), and to what. */
export function RsvpReview({ value, onChange }) {
  const { colors, radii } = useTheme();
  const guests = useGuestStore(selectAllGuests);
  const byId = new Map(guests.map((guest) => [guest.id, guest]));
  const ids = (value.guestIds ?? []).filter((id) => byId.has(id));

  return (
    <Stack gap="md">
      <Row gap="xs" wrap align="flex-start">
        {RSVP_CHOICES.map((status) => (
          <Chip
            key={status}
            label={RSVP_STATUS_META[status]?.label ?? status}
            size="sm"
            selected={value.rsvpStatus === status}
            onPress={() => onChange({ ...value, rsvpStatus: status })}
          />
        ))}
      </Row>
      <Stack gap="xs">
        {ids.map((id) => (
          <Row key={id} gap="xs" align="center">
            <Text variant="body" style={{ flex: 1 }}>
              {guestFullName(byId.get(id))}
            </Text>
            <Touchable
              onPress={() => onChange({ ...value, guestIds: ids.filter((other) => other !== id) })}
              accessibilityLabel={`Leave out ${guestFullName(byId.get(id))}`}
              style={{
                width: 36,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: radii.md,
                backgroundColor: colors.surfaceSunken,
              }}
            >
              <Icon name="close" size="sm" color="inkMuted" />
            </Touchable>
          </Row>
        ))}
        {ids.length === 0 ? (
          <Text variant="body" color="muted">
            No guests left to change. Discard the suggestion, or ask again with the name on your list.
          </Text>
        ) : null}
      </Stack>
    </Stack>
  );
}
