import React from 'react';

import { Stack, Text } from '@/design-system/components';

import { ProfileSection } from '../components/ProfileSection';
import { ProfileChipField } from '../components/ProfileChipField';
import {
  PROFILE_SECTION_META,
  PROFILE_SECTIONS,
  STYLE_OPTIONS,
  STRESSOR_FIELD_OPTIONS,
} from '../lib/profileConstants';
import { labelsForStyles } from '../lib/profileHelpers';

/**
 * Style tags and stressors - the softer side of the profile.
 *
 * Both are multi-select. Style feeds the vision and assistant tone; stressors
 * let the companion acknowledge what weighs on the couple without turning the
 * whole product into a worry questionnaire.
 */
export function VisionFields({
  values,
  onChange,
  highlighted = false,
}) {
  const meta = PROFILE_SECTION_META[PROFILE_SECTIONS.VISION];
  const styleSummary = labelsForStyles(values.styleTags);

  return (
    <ProfileSection
      eyebrow={meta.eyebrow}
      title={meta.title}
      subtitle={meta.subtitle}
      icon={meta.icon}
      highlighted={highlighted}
      testID="profile-section-vision"
      footer={
        styleSummary.length > 0 ? (
          <Text variant="caption" color="subtle">
            Selected: {styleSummary.join(' · ')}
          </Text>
        ) : null
      }
    >
      <Stack gap="lg">
        <ProfileChipField
          eyebrow="Drawn to"
          title="Style"
          subtitle="Pick as many as feel right. You can change them any time."
          options={STYLE_OPTIONS}
          value={values.styleTags}
          onChange={(next) => onChange?.('styleTags', next)}
          multiple
          helper="Used for inspiration and for how the assistant talks about your day."
        />

        <ProfileChipField
          eyebrow="What weighs on you"
          title="Focus areas"
          subtitle="Optional. Naming it helps me stay useful without nagging."
          options={STRESSOR_FIELD_OPTIONS}
          value={values.stressors}
          onChange={(next) => onChange?.('stressors', next)}
          multiple
        />
      </Stack>
    </ProfileSection>
  );
}

export default VisionFields;
