import React, { forwardRef, useState, useCallback, useId } from 'react';
import { TextInput, View, StyleSheet } from 'react-native';

import { useTheme } from '../theme';
import Text from './Text';
import Icon from './Icon';
import Touchable from './Touchable';

/**
 * TextField.
 *
 * Carries the full control state matrix: default, focused, disabled, error and
 * success. The border colour is the single signal - we do not also tint the
 * background, because a form of tinted boxes reads as an admin tool, which the
 * PRD explicitly rules out (s.27).
 *
 * Validation display is the caller's decision: pass `error` only once the field
 * should show it. Most screens validate on blur and on submit, never on every
 * keystroke, so the user is not scolded mid-word.
 */
export const TextField = forwardRef(function TextField(
  {
    label,
    value,
    onChangeText,
    placeholder,
    /** Message shown under the field in normal conditions. */
    helper,
    /** Non-empty switches the field into its error state. */
    error,
    success = false,
    disabled = false,
    required = false,
    multiline = false,
    numberOfLines = 4,
    /** Short text inside the field before the value, e.g. a currency symbol. */
    prefix,
    suffix,
    /** Icon name rendered at the end; pressing it calls `onIconPress`. */
    icon,
    onIconPress,
    /** Screen-reader label for the icon button. Say what it does, e.g. "Show password". */
    iconAccessibilityLabel,
    onBlur,
    onFocus,
    style,
    inputStyle,
    containerStyle,
    testID,
    ...inputProps
  },
  ref
) {
  const { colors, spacing, radii, controlHeights, borderWidths, text } = useTheme();
  const [focused, setFocused] = useState(false);
  const labelId = useId();

  const handleFocus = useCallback(
    (event) => {
      setFocused(true);
      onFocus?.(event);
    },
    [onFocus]
  );

  const handleBlur = useCallback(
    (event) => {
      setFocused(false);
      onBlur?.(event);
    },
    [onBlur]
  );

  const borderColor = error
    ? colors.danger
    : success
      ? colors.success
      : focused
        ? colors.borderFocus
        : colors.border;

  const message = error || helper;
  const messageColor = error ? 'danger' : 'subtle';

  return (
    <View style={[{ gap: spacing.xs }, containerStyle, style]}>
      {label && (
        <View style={styles.labelRow}>
          <Text variant="label" color="muted" nativeID={labelId}>
            {label}
          </Text>
          {required && (
            <Text variant="label" color="danger">
              *
            </Text>
          )}
        </View>
      )}

      <View
        style={[
          styles.field,
          {
            minHeight: multiline ? undefined : controlHeights.lg,
            paddingHorizontal: spacing.md,
            paddingVertical: multiline ? spacing.sm : 0,
            borderRadius: radii.md,
            borderWidth: focused || error || success ? borderWidths.thin : borderWidths.hairline,
            borderColor,
            backgroundColor: disabled ? colors.surfaceSunken : colors.surface,
            gap: spacing.xs,
            alignItems: multiline ? 'flex-start' : 'center',
          },
        ]}
      >
        {prefix && (
          <Text variant="body" color="subtle">
            {prefix}
          </Text>
        )}

        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.inkSubtle}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          onFocus={handleFocus}
          onBlur={handleBlur}
          accessibilityLabel={label}
          accessibilityLabelledBy={label ? labelId : undefined}
          accessibilityState={{ disabled }}
          accessibilityHint={error || helper}
          testID={testID}
          style={[
            text.body,
            {
              flex: 1,
              color: disabled ? colors.inkSubtle : colors.ink,
              // RN adds invisible vertical padding to multiline inputs on Android.
              textAlignVertical: multiline ? 'top' : 'center',
              minHeight: multiline ? numberOfLines * 22 : undefined,
              paddingVertical: 0,
            },
            inputStyle,
          ]}
          {...inputProps}
        />

        {suffix && (
          <Text variant="body" color="subtle">
            {suffix}
          </Text>
        )}

        {success && !icon && <Icon name="check" size="md" color="success" />}

        {icon &&
          (onIconPress ? (
            <Touchable
              onPress={onIconPress}
              haptic="light"
              scaleOnPress={false}
              hitSlop={12}
              accessibilityLabel={iconAccessibilityLabel ?? `${label ?? 'Field'} action`}
            >
              <Icon name={icon} size="md" color="inkMuted" />
            </Touchable>
          ) : (
            <Icon name={icon} size="md" color="inkMuted" />
          ))}
      </View>

      {message && (
        <Text variant="caption" color={messageColor} accessibilityLiveRegion={error ? 'polite' : 'none'}>
          {message}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  field: {
    flexDirection: 'row',
  },
});

export default TextField;
