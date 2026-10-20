import React from 'react';

import { Stack, Text, Button, Row } from '@/design-system/components';

import { PersonalFields } from '../fields/PersonalFields';
import { PartnerFields } from '../fields/PartnerFields';
import { WeddingDetailsFields } from '../fields/WeddingDetailsFields';
import { VisionFields } from '../fields/VisionFields';
import { PROFILE_COPY, PROFILE_SECTIONS } from '../lib/profileConstants';

/**
 * The editable body of the Profile screen.
 *
 * Composes the four field sections and owns the sticky-feeling save/discard
 * actions at the bottom of the form (the Screen footer can also host them;
 * this block keeps the form usable when Profile is embedded without a footer).
 */
export function ProfileForm({
  values,
  errors,
  dirty,
  saving,
  focusedSection,
  onChange,
  onBlur,
  onLocate,
  onGuestCountOption,
  onSave,
  onDiscard,
  showActions = true,
  style,
}) {
  return (
    <Stack gap="xl" style={style} testID="profile-form">
      <PersonalFields
        values={values}
        errors={errors}
        onChange={onChange}
        onBlur={onBlur}
        highlighted={focusedSection === PROFILE_SECTIONS.PERSONAL}
      />

      <PartnerFields
        values={values}
        errors={errors}
        onChange={onChange}
        onBlur={onBlur}
        highlighted={focusedSection === PROFILE_SECTIONS.PARTNER}
      />

      <WeddingDetailsFields
        values={values}
        errors={errors}
        onChange={onChange}
        onBlur={onBlur}
        onLocate={onLocate}
        onGuestCountOption={onGuestCountOption}
        highlighted={focusedSection === PROFILE_SECTIONS.WEDDING}
      />

      <VisionFields
        values={values}
        onChange={onChange}
        highlighted={focusedSection === PROFILE_SECTIONS.VISION}
      />

      {showActions ? (
        <Stack gap="sm" testID="profile-form-actions">
          {dirty ? (
            <Text variant="caption" color="brand">
              {PROFILE_COPY.dirtyHint}
            </Text>
          ) : null}

          <Button
            label={saving ? PROFILE_COPY.savingLabel : PROFILE_COPY.saveLabel}
            onPress={onSave}
            loading={saving}
            disabled={!dirty || saving}
            iconLeft="check"
          />

          <Row gap="xs">
            <Button
              label={PROFILE_COPY.discardLabel}
              variant="ghost"
              onPress={onDiscard}
              disabled={!dirty || saving}
              style={{ flex: 1 }}
            />
          </Row>
        </Stack>
      ) : null}
    </Stack>
  );
}

export default ProfileForm;
