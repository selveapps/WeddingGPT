import React from 'react';

import { Button, Chip, Row, SectionHeader, Stack, TextField } from '@/design-system/components';
import { VENDOR_CATEGORIES, VENDOR_STATUS_META } from '@/models';
import { DateField } from '@/features/shared/DateField';
import { MoneyField } from '@/features/shared/MoneyField';
import { BOOKING_COPY, BOOKING_PLACEHOLDERS } from '../lib/bookingConstants';

export function BookingForm({
  values,
  errors,
  currency = 'USD',
  editing = false,
  onChange,
  onBlur,
  onSubmit,
  onCancel,
  saving = false,
}) {
  return (
    <Stack gap="lg">
      <Stack gap="md">
        <TextField
          label="Vendor name"
          value={values.name}
          onChangeText={(value) => onChange('name', value)}
          placeholder={BOOKING_PLACEHOLDERS.name}
          error={errors.name}
          onBlur={() => onBlur?.('name')}
          autoCapitalize="words"
          autoFocus={!editing}
          required
        />
        <TextField
          label="Contact person"
          value={values.contactName}
          onChangeText={(value) => onChange('contactName', value)}
          placeholder={BOOKING_PLACEHOLDERS.contactName}
          error={errors.contactName}
          onBlur={() => onBlur?.('contactName')}
          autoCapitalize="words"
        />
        <TextField
          label="Email"
          value={values.email}
          onChangeText={(value) => onChange('email', value)}
          placeholder={BOOKING_PLACEHOLDERS.email}
          error={errors.email}
          onBlur={() => onBlur?.('email')}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextField
          label="Phone"
          value={values.phone}
          onChangeText={(value) => onChange('phone', value)}
          placeholder={BOOKING_PLACEHOLDERS.phone}
          error={errors.phone}
          onBlur={() => onBlur?.('phone')}
          keyboardType="phone-pad"
        />
        <TextField
          label="Website"
          value={values.website}
          onChangeText={(value) => onChange('website', value)}
          placeholder={BOOKING_PLACEHOLDERS.website}
          error={errors.website}
          onBlur={() => onBlur?.('website')}
          autoCapitalize="none"
          keyboardType="url"
        />
        <TextField
          label="City"
          value={values.city}
          onChangeText={(value) => onChange('city', value)}
          placeholder={BOOKING_PLACEHOLDERS.city}
          error={errors.city}
          onBlur={() => onBlur?.('city')}
          autoCapitalize="words"
        />
      </Stack>

      <Stack gap="sm">
        <SectionHeader eyebrow="Vendor type" title="Category" />
        <Row gap="xs" wrap align="flex-start">
          {VENDOR_CATEGORIES.map((category) => (
            <Chip
              key={category.key}
              label={category.name}
              icon={category.icon}
              size="sm"
              selected={values.categoryKey === category.key}
              onPress={() => onChange('categoryKey', category.key)}
            />
          ))}
        </Row>
      </Stack>

      <Stack gap="sm">
        <SectionHeader eyebrow="Where things stand" title="Status" />
        <Row gap="xs" wrap align="flex-start">
          {Object.entries(VENDOR_STATUS_META).map(([status, meta]) => (
            <Chip
              key={status}
              label={meta.label}
              size="sm"
              selected={values.status === status}
              onPress={() => onChange('status', status)}
            />
          ))}
        </Row>
      </Stack>

      <Stack gap="md">
        <SectionHeader eyebrow="Quote" title="Pricing and scope" />
        <TextField
          label="Rough price range"
          value={values.priceHint}
          onChangeText={(value) => onChange('priceHint', value)}
          placeholder={BOOKING_PLACEHOLDERS.priceHint}
          error={errors.priceHint}
          onBlur={() => onBlur?.('priceHint')}
        />
        <MoneyField
          label="Quoted amount"
          value={values.quotedAmount}
          onChange={(value) => onChange('quotedAmount', value)}
          currency={currency}
          error={errors.quotedAmount}
          onBlur={() => onBlur?.('quotedAmount')}
        />
        <TextField
          label="What the quote covers"
          value={values.quoteScope}
          onChangeText={(value) => onChange('quoteScope', value)}
          placeholder={BOOKING_PLACEHOLDERS.scope}
          error={errors.quoteScope}
          onBlur={() => onBlur?.('quoteScope')}
          multiline
          numberOfLines={3}
          autoCapitalize="sentences"
        />
        <DateField label="Quote valid until" value={values.quoteValidUntil} onChange={(value) => onChange('quoteValidUntil', value)} />
        <DateField label="Meeting date" value={values.meetingAt} onChange={(value) => onChange('meetingAt', value)} />
      </Stack>

      <Stack gap="md">
        <SectionHeader eyebrow="Payment plan" title="Milestones" />
        <MoneyField
          label="Deposit"
          value={values.depositAmount}
          onChange={(value) => onChange('depositAmount', value)}
          currency={currency}
          error={errors.depositAmount}
        />
        <DateField label="Deposit due" value={values.depositDueAt} onChange={(value) => onChange('depositDueAt', value)} />
        <MoneyField
          label="Final balance"
          value={values.finalAmount}
          onChange={(value) => onChange('finalAmount', value)}
          currency={currency}
          error={errors.finalAmount}
        />
        <DateField label="Final balance due" value={values.finalDueAt} onChange={(value) => onChange('finalDueAt', value)} />
      </Stack>

      <Stack gap="md">
        <SectionHeader eyebrow="Remember" title="Notes" />
        <TextField
          label="Notes"
          value={values.notes}
          onChangeText={(value) => onChange('notes', value)}
          placeholder={BOOKING_PLACEHOLDERS.notes}
          error={errors.notes}
          onBlur={() => onBlur?.('notes')}
          multiline
          numberOfLines={4}
          autoCapitalize="sentences"
        />
      </Stack>

      <Stack gap="xs">
        <Button
          label={editing ? BOOKING_COPY.saveLabel : BOOKING_COPY.addLabel}
          onPress={onSubmit}
          loading={saving}
        />
        {onCancel ? <Button label="Cancel" variant="ghost" onPress={onCancel} disabled={saving} /> : null}
      </Stack>
    </Stack>
  );
}

export default BookingForm;
