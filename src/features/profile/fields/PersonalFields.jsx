import React from 'react';

import { Stack, TextField } from '@/design-system/components';

import { ProfileSection } from '../components/ProfileSection';
import { PROFILE_SECTION_META, PROFILE_PLACEHOLDERS, PROFILE_SECTIONS } from '../lib/profileConstants';

/**
 * Name, email and phone - the personal slice of the profile.
 *
 * Only the name is required. Contact details are validated when provided, and
 * empty strings are normalised to null on save so "no email" is one value.
 */
export function PersonalFields({
  values,
  errors,
  onChange,
  onBlur,
  highlighted = false,
}) {
  const meta = PROFILE_SECTION_META[PROFILE_SECTIONS.PERSONAL];

  return (
    <ProfileSection
      eyebrow={meta.eyebrow}
      title={meta.title}
      subtitle={meta.subtitle}
      icon={meta.icon}
      highlighted={highlighted}
      testID="profile-section-personal"
    >
      <Stack gap="md">
        <TextField
          label="Your name"
          value={values.ownerName}
          onChangeText={(next) => onChange('ownerName', next)}
          onBlur={() => onBlur?.('ownerName')}
          placeholder={PROFILE_PLACEHOLDERS.ownerName}
          error={errors.ownerName}
          autoCapitalize="words"
          autoCorrect={false}
          required
          testID="profile-field-ownerName"
        />

        <TextField
          label="Email"
          value={values.email}
          onChangeText={(next) => onChange('email', next)}
          onBlur={() => onBlur?.('email')}
          placeholder={PROFILE_PLACEHOLDERS.email}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          helper="Optional. Kept on this device for now."
          testID="profile-field-email"
        />

        <TextField
          label="Phone"
          value={values.phone}
          onChangeText={(next) => onChange('phone', next)}
          onBlur={() => onBlur?.('phone')}
          placeholder={PROFILE_PLACEHOLDERS.phone}
          error={errors.phone}
          keyboardType="phone-pad"
          helper="Optional. Useful later for vendor calls and day-of contacts."
          testID="profile-field-phone"
        />
      </Stack>
    </ProfileSection>
  );
}

export default PersonalFields;
