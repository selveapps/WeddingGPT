import React from 'react';
import { View } from 'react-native';

import { useTheme } from '../theme';
import BottomSheet from './BottomSheet';
import Button from './Button';
import Text from './Text';
import Icon from './Icon';

/**
 * ConfirmSheet - explicit confirmation before anything consequential happens.
 *
 * This is the component behind two PRD requirements:
 *  - Destructive actions (deleting a guest, an expense, the account) must be
 *    confirmed, never one-tap.
 *  - The AI must never silently modify wedding data (s.13): it proposes, the
 *    user reviews, and only an explicit confirmation commits. `children` is the
 *    preview slot where the proposed change is rendered - and, where the change
 *    is editable, edited - before `onConfirm` fires.
 *
 * Destructive variants deliberately do not auto-dismiss on backdrop tap, so a
 * stray tap outside can never be mistaken for consent.
 */
export function ConfirmSheet({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  /** Preview of what will change. Rendered between the message and the buttons. */
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  /** Styles the confirm button as danger and disables tap-outside dismissal. */
  destructive = false,
  loading = false,
  icon,
  testID,
}) {
  const { spacing, colors, radii } = useTheme();

  const tone = destructive ? 'danger' : 'brand';

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      dismissible={!destructive && !loading}
      showHandle={!destructive}
      testID={testID}
      footer={
        <View style={{ gap: spacing.xs }}>
          <Button
            label={confirmLabel}
            variant={destructive ? 'danger' : 'primary'}
            loading={loading}
            onPress={onConfirm}
          />
          <Button
            label={cancelLabel}
            variant="ghost"
            disabled={loading}
            onPress={onClose}
          />
        </View>
      }
    >
      <View style={{ alignItems: 'center', gap: spacing.sm, paddingTop: spacing.sm }}>
        {icon && (
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: radii.pill,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors[`${tone}Soft`],
            }}
          >
            <Icon name={icon} size="lg" color={colors[`${tone}SoftInk`]} />
          </View>
        )}

        <Text variant="h2" align="center" heading>
          {title}
        </Text>

        {message && (
          <Text variant="body" color="muted" align="center">
            {message}
          </Text>
        )}
      </View>

      {children && <View style={{ marginTop: spacing.md }}>{children}</View>}
    </BottomSheet>
  );
}

export default ConfirmSheet;
