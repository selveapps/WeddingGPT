import React, { useEffect, useState } from 'react';

import { Stack, Text, Button, SegmentedControl, SectionHeader } from '@/design-system/components';

import { PersonalFields } from '../fields/PersonalFields';
import { PartnerFields } from '../fields/PartnerFields';
import { WeddingDetailsFields } from '../fields/WeddingDetailsFields';
import { VisionFields } from '../fields/VisionFields';
import {
  PROFILE_COPY,
  PROFILE_SECTIONS,
  PROFILE_SECTION_TABS,
  PROFILE_LAYOUT_COPY,
} from '../lib/profileConstants';

/**
 * The editable body of the Profile screen.
 *
 * Instead of four long cards stacked on top of each other, a segmented
 * switcher shows one section at a time. Values for every section stay in the
 * shared form state, so switching never loses an edit and a single save still
 * writes everything.
 *
 * `focusedSection` (set by a failed save, a "Next up" tap or a snapshot tile)
 * jumps the switcher to that section and highlights it.
 *
 * Save/discard actions are optional here: the screen footer normally hosts
 * them, this block keeps the form usable when embedded without a footer.
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
  onSectionChange,
  showActions = true,
  showHeader = true,
  style,
}) {
  const [active, setActive] = useState(focusedSection ?? PROFILE_SECTIONS.PERSONAL);
  // SegmentedControl only animates its indicator on press, so an external jump
  // (Next up, snapshot tile, failed save) remounts it at the new position.
  const [syncKey, setSyncKey] = useState(0);

  useEffect(() => {
    if (!focusedSection) return;
    setActive(focusedSection);
    setSyncKey((key) => key + 1);
  }, [focusedSection]);

  const handleTabChange = (next) => {
    setActive(next);
    onSectionChange?.(next);
  };

  const highlighted = (section) => focusedSection === section && active === section;

  return (
    <Stack gap="md" style={style} testID="profile-form">
      {showHeader ? (
        <SectionHeader
          eyebrow={PROFILE_LAYOUT_COPY.editEyebrow}
          title={PROFILE_LAYOUT_COPY.editTitle}
          subtitle={PROFILE_LAYOUT_COPY.editSubtitle}
        />
      ) : null}

      <SegmentedControl
        key={syncKey}
        options={PROFILE_SECTION_TABS}
        value={active}
        onChange={handleTabChange}
        testID="profile-section-tabs"
      />

      {active === PROFILE_SECTIONS.PERSONAL ? (
        <PersonalFields
          values={values}
          errors={errors}
          onChange={onChange}
          onBlur={onBlur}
          highlighted={highlighted(PROFILE_SECTIONS.PERSONAL)}
        />
      ) : null}

      {active === PROFILE_SECTIONS.PARTNER ? (
        <PartnerFields
          values={values}
          errors={errors}
          onChange={onChange}
          onBlur={onBlur}
          highlighted={highlighted(PROFILE_SECTIONS.PARTNER)}
        />
      ) : null}

      {active === PROFILE_SECTIONS.WEDDING ? (
        <WeddingDetailsFields
          values={values}
          errors={errors}
          onChange={onChange}
          onBlur={onBlur}
          onLocate={onLocate}
          onGuestCountOption={onGuestCountOption}
          highlighted={highlighted(PROFILE_SECTIONS.WEDDING)}
        />
      ) : null}

      {active === PROFILE_SECTIONS.VISION ? (
        <VisionFields
          values={values}
          onChange={onChange}
          highlighted={highlighted(PROFILE_SECTIONS.VISION)}
        />
      ) : null}

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
          <Button
            label={PROFILE_COPY.discardLabel}
            variant="ghost"
            onPress={onDiscard}
            disabled={!dirty || saving}
          />
        </Stack>
      ) : null}
    </Stack>
  );
}

export default ProfileForm;
