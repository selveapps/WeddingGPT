import React from 'react';

import { Stack, Text, Button } from '@/design-system/components';

import { PROFILE_COPY } from '../lib/profileConstants';

/**
 * Docked save/discard controls for the Profile screen footer.
 *
 * Extracted so the Screen footer slot and any future modal embed share one
 * layout and one set of disabled/loading rules.
 */
export function ProfileStickyActions({
  dirty,
  saving,
  onSave,
  onDiscard,
  style,
}) {
  if (!dirty) return null;

  return (
    <Stack gap="xs" style={style} testID="profile-sticky-actions">
      <Text variant="caption" color="brand" style={{ textAlign: 'center' }}>
        {PROFILE_COPY.dirtyHint}
      </Text>
      <Button
        label={saving ? PROFILE_COPY.savingLabel : PROFILE_COPY.saveLabel}
        onPress={onSave}
        loading={saving}
        disabled={saving}
        iconLeft="check"
      />
      <Button
        label={PROFILE_COPY.discardLabel}
        variant="ghost"
        onPress={onDiscard}
        disabled={saving}
      />
    </Stack>
  );
}

export default ProfileStickyActions;
