import React, { useMemo } from 'react';

import { Stack, TextField, Text, Row, Chip } from '@/design-system/components';
import { DateField } from '@/features/shared/DateField';
import { MoneyField } from '@/features/shared/MoneyField';
import { LocationField } from '@/features/local/LocationField';

import { ProfileSection } from '../components/ProfileSection';
import { ProfileChipField } from '../components/ProfileChipField';
import {
  PROFILE_SECTION_META,
  PROFILE_PLACEHOLDERS,
  PROFILE_SECTIONS,
  DATE_TYPE_OPTIONS,
  CEREMONY_OPTIONS,
  PLANNING_STAGE_OPTIONS,
  GUEST_COUNT_FIELD_OPTIONS,
} from '../lib/profileConstants';

/**
 * Date, place, guest count, budget, ceremony type and planning stage.
 *
 * This is the densest section on the profile, so it leans on shared field
 * components (`DateField`, `MoneyField`, `LocationField`) rather than reinventing
 * pickers that already exist elsewhere in the product.
 */
export function WeddingDetailsFields({
  values,
  errors,
  onChange,
  onBlur,
  onLocate,
  onGuestCountOption,
  highlighted = false,
}) {
  const meta = PROFILE_SECTION_META[PROFILE_SECTIONS.WEDDING];

  const guestCountText = useMemo(() => {
    if (values.guestCountEstimate == null) return '';
    return String(values.guestCountEstimate);
  }, [values.guestCountEstimate]);

  const selectedGuestBand = useMemo(() => {
    if (values.guestCountEstimate == null) return null;
    const n = Number(values.guestCountEstimate);
    // Prefer an exact band match; otherwise leave chips unselected so a custom
    // number does not light up the nearest band and look wrong.
    return GUEST_COUNT_FIELD_OPTIONS.find((option) => option.value === n)?.value ?? null;
  }, [values.guestCountEstimate]);

  return (
    <ProfileSection
      eyebrow={meta.eyebrow}
      title={meta.title}
      subtitle={meta.subtitle}
      icon={meta.icon}
      highlighted={highlighted}
      testID="profile-section-wedding"
    >
      <Stack gap="lg">
        <Stack gap="sm">
          <ProfileChipField
            eyebrow="How sure are you"
            title="Date certainty"
            options={DATE_TYPE_OPTIONS}
            value={values.dateType}
            onChange={(next) => onChange('dateType', next)}
          />
          <DateField
            label="Wedding date"
            value={values.date}
            onChange={(next) => {
              onChange('date', next);
              if (next && values.dateType === 'undecided') {
                onChange('dateType', 'exact');
              }
            }}
            placeholder="Add a date"
            clearable
          />
          {errors.date ? (
            <Text variant="caption" color="danger">
              {errors.date}
            </Text>
          ) : null}
        </Stack>

        <Stack gap="sm">
          <LocationField
            label="City"
            value={values.city}
            onChangeText={(next) => onChange('city', next)}
            onLocate={onLocate}
          />
          {errors.city ? (
            <Text variant="caption" color="danger">
              {errors.city}
            </Text>
          ) : null}

          <Row gap="sm" style={{ alignItems: 'flex-start' }}>
            <Stack gap="sm" style={{ flex: 1 }}>
              <TextField
                label="Region / state"
                value={values.region}
                onChangeText={(next) => onChange('region', next)}
                onBlur={() => onBlur?.('region')}
                placeholder={PROFILE_PLACEHOLDERS.region}
                error={errors.region}
                autoCapitalize="words"
              />
            </Stack>
            <Stack gap="sm" style={{ flex: 1 }}>
              <TextField
                label="Country"
                value={values.country}
                onChangeText={(next) => onChange('country', next)}
                onBlur={() => onBlur?.('country')}
                placeholder={PROFILE_PLACEHOLDERS.country}
                error={errors.country}
                autoCapitalize="words"
              />
            </Stack>
          </Row>

          <TextField
            label="Venue"
            value={values.venueName}
            onChangeText={(next) => onChange('venueName', next)}
            onBlur={() => onBlur?.('venueName')}
            placeholder={PROFILE_PLACEHOLDERS.venueName}
            error={errors.venueName}
            autoCapitalize="words"
            helper="Leave blank until you book - the city is enough for local picks."
          />
        </Stack>

        <Stack gap="sm">
          <Text variant="eyebrow" color="subtle">
            Roughly how many people
          </Text>
          <Text variant="h4" heading>
            Guest count
          </Text>
          <Row gap="xs" wrap align="flex-start">
            {GUEST_COUNT_FIELD_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                size="sm"
                selected={selectedGuestBand === option.value}
                onPress={() => onGuestCountOption?.(option.value)}
              />
            ))}
          </Row>
          <TextField
            label="Or type a number"
            value={guestCountText}
            onChangeText={(next) => onChange('guestCountEstimate', next.replace(/[^\d]/g, '') === ''
              ? null
              : Number(next.replace(/[^\d]/g, '')))}
            onBlur={() => onBlur?.('guestCountEstimate')}
            placeholder={PROFILE_PLACEHOLDERS.guestCount}
            error={errors.guestCountEstimate}
            keyboardType="number-pad"
            helper="A band is fine. Exact headcount can wait."
          />
        </Stack>

        <MoneyField
          label="Budget"
          value={values.budgetTotal}
          onChange={(next) => onChange('budgetTotal', next)}
          currency={values.currency}
          error={errors.budgetTotal}
          helper="A starting number - you can refine it on the Budget tab."
          placeholder="25000"
        />

        <ProfileChipField
          eyebrow="What kind of day"
          title="Celebration"
          options={CEREMONY_OPTIONS}
          value={values.ceremonyType}
          onChange={(next) => onChange('ceremonyType', next)}
        />

        <ProfileChipField
          eyebrow="Where you are in the process"
          title="Planning stage"
          options={PLANNING_STAGE_OPTIONS}
          value={values.planningStage}
          onChange={(next) => onChange('planningStage', next)}
        />
      </Stack>
    </ProfileSection>
  );
}

export default WeddingDetailsFields;
