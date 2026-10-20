import React from 'react';

import { Stack, Row, TextField, Checkbox, Text } from '@/design-system/components';

import { ProfileSection } from '../components/ProfileSection';
import {
  PROFILE_SECTION_META,
  PROFILE_PLACEHOLDERS,
  PROFILE_SECTIONS,
  PROFILE_COPY,
} from '../lib/profileConstants';

/**
 * Partner name, optional email, and a soft collaboration flag.
 *
 * Collaboration does not unlock two-phone editing yet - it only changes how
 * the product talks about tasks ("both of you") so the couple can plan as a
 * pair before accounts catch up.
 */
export function PartnerFields({
  values,
  errors,
  onChange,
  onBlur,
  highlighted = false,
}) {
  const meta = PROFILE_SECTION_META[PROFILE_SECTIONS.PARTNER];

  return (
    <ProfileSection
      eyebrow={meta.eyebrow}
      title={meta.title}
      subtitle={meta.subtitle}
      icon={meta.icon}
      highlighted={highlighted}
      testID="profile-section-partner"
      footer={
        <Text variant="caption" color="subtle">
          {PROFILE_COPY.partnerInviteHint}
        </Text>
      }
    >
      <Stack gap="md">
        <TextField
          label="Partner's name"
          value={values.partnerName}
          onChangeText={(next) => onChange('partnerName', next)}
          onBlur={() => onBlur?.('partnerName')}
          placeholder={PROFILE_PLACEHOLDERS.partnerName}
          error={errors.partnerName}
          autoCapitalize="words"
          autoCorrect={false}
          testID="profile-field-partnerName"
        />

        <TextField
          label="Partner's email"
          value={values.partnerEmail}
          onChangeText={(next) => onChange('partnerEmail', next)}
          onBlur={() => onBlur?.('partnerEmail')}
          placeholder={PROFILE_PLACEHOLDERS.partnerEmail}
          error={errors.partnerEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          helper="Optional. Used when you send them an invite."
          testID="profile-field-partnerEmail"
        />

        <Stack gap="xs">
          <Row gap="sm" align="center">
            <Checkbox
              checked={Boolean(values.collaborationEnabled)}
              onChange={(next) => onChange('collaborationEnabled', next)}
              round={false}
              label={PROFILE_COPY.collaborationLabel}
              testID="profile-field-collaboration"
            />
            <Text variant="body" style={{ flex: 1 }}>
              {PROFILE_COPY.collaborationLabel}
            </Text>
          </Row>
          <Text variant="caption" color="subtle">
            {PROFILE_COPY.collaborationHelper}
          </Text>
        </Stack>
      </Stack>
    </ProfileSection>
  );
}

export default PartnerFields;
