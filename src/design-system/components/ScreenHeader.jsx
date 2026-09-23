import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { useTheme } from '../theme';
import Text from './Text';
import Icon from './Icon';
import Touchable from './Touchable';
import { Row, Stack } from './Stack';

/**
 * The header for a pushed screen: back control, title, optional action.
 *
 * The navigator draws no header of its own (see `app/_layout`), because the
 * tabs need their content to start at the top. Pushed screens still need a way
 * back, so they draw this instead - one component rather than a hand-rolled row
 * on each of a dozen detail screens, which is what PRD s.20 is asking for.
 *
 * `onBack` defaults to `router.back()`. Pass it explicitly on screens that must
 * go somewhere specific, such as one entered by `replace`, where there is no
 * sensible previous entry in the stack.
 */
export function ScreenHeader({
  title,
  eyebrow,
  onBack,
  backLabel = 'Go back',
  /** Icon name for a single trailing action. */
  actionIcon,
  onActionPress,
  actionLabel,
  /** Custom node on the right; takes precedence over `actionIcon`. */
  trailing,
  style,
}) {
  const router = useRouter();
  const { spacing } = useTheme();

  const handleBack = onBack ?? (() => router.back());

  return (
    <Row gap="sm" align="center" style={[{ minHeight: 44, marginBottom: spacing.xs }, style]}>
      <Touchable onPress={handleBack} accessibilityLabel={backLabel} hitSlop={12}>
        <Icon name="chevronLeft" size="md" color="inkMuted" />
      </Touchable>

      <Stack gap="hair" style={{ flex: 1 }}>
        {eyebrow ? (
          <Text variant="eyebrow" color="subtle">
            {eyebrow}
          </Text>
        ) : null}
        {title ? (
          <Text variant="h4" heading numberOfLines={1}>
            {title}
          </Text>
        ) : null}
      </Stack>

      {/* Reserved width keeps the title centred consistently whether or not a
          screen has a trailing action. */}
      {trailing ?? (
        actionIcon ? (
          <Touchable
            onPress={onActionPress}
            accessibilityLabel={actionLabel ?? 'Action'}
            hitSlop={12}
          >
            <Icon name={actionIcon} size="md" color="inkMuted" />
          </Touchable>
        ) : (
          <View style={{ width: 24 }} />
        )
      )}
    </Row>
  );
}

export default ScreenHeader;
