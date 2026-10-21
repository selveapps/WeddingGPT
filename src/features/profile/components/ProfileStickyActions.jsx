import React from 'react';

import { Stack, Row, Text, Button, Icon } from '@/design-system/components';

import { PROFILE_COPY } from '../lib/profileConstants';

/**
 * Docked save/discard controls for the Profile screen footer.
 *
 * One compact row - a small "unsaved" hint, then Discard and Save side by
 * side - so the footer takes as little of the screen as possible while the
 * couple is still typing.
 */
export function ProfileStickyActions({ dirty, saving, onSave, onDiscard, style }) {
  if (!dirty) return null;

  return (
    <Stack gap="xs" style={style} testID="profile-sticky-actions">
      <Row gap="xxs" justify="center">
        <Icon name="edit" size="xs" color="brand" />
        <Text variant="caption" color="brand">
          {PROFILE_COPY.dirtyHint}
        </Text>
      </Row>
      <Row gap="sm">
        <Button
          label={PROFILE_COPY.discardLabel}
          variant="secondary"
          size="md"
          onPress={onDiscard}
          disabled={saving}
          style={{ flex: 1 }}
        />
        <Button
          label={saving ? PROFILE_COPY.savingLabel : PROFILE_COPY.saveLabel}
          size="md"
          onPress={onSave}
          loading={saving}
          disabled={saving}
          iconLeft="check"
          style={{ flex: 2 }}
        />
      </Row>
    </Stack>
  );
}

export default ProfileStickyActions;
