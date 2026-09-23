import React, { useMemo } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

import { useTheme } from '../theme';
import Touchable from './Touchable';
import Text from './Text';
import Icon from './Icon';

/**
 * Button.
 *
 * Covers the full state matrix the PRD asks for (s.17): default, pressed,
 * disabled, loading and success. Pressed feedback comes from `Touchable`;
 * success is a transient visual the caller drives by flipping `success` to true
 * for a moment after a save lands.
 *
 * Variants map to meaning, not colour:
 *  primary   - the one action the screen wants you to take
 *  secondary - a supporting action of equal legitimacy
 *  ghost     - low-emphasis, sits inside dense layouts
 *  danger    - destructive, always paired with a confirmation
 */

const SIZE_TOKENS = {
  sm: { height: 'sm', px: 'sm', gap: 'xxs', text: 'actionSm', icon: 'sm', radius: 'sm' },
  md: { height: 'md', px: 'md', gap: 'xs', text: 'action', icon: 'md', radius: 'md' },
  lg: { height: 'lg', px: 'lg', gap: 'xs', text: 'action', icon: 'md', radius: 'lg' },
  xl: { height: 'xl', px: 'xl', gap: 'sm', text: 'action', icon: 'lg', radius: 'lg' },
};

function useVariantStyle(variant, success) {
  const { colors, borderWidths } = useTheme();

  return useMemo(() => {
    if (success) {
      return {
        container: { backgroundColor: colors.success, borderColor: colors.success },
        content: 'inkOnBrand',
      };
    }

    switch (variant) {
      case 'secondary':
        return {
          container: {
            backgroundColor: colors.surface,
            borderColor: colors.borderStrong,
            borderWidth: borderWidths.hairline,
          },
          content: 'ink',
        };
      case 'soft':
        return {
          container: { backgroundColor: colors.brandSoft, borderColor: 'transparent' },
          content: 'brandSoftInk',
        };
      case 'ghost':
        return {
          container: { backgroundColor: 'transparent', borderColor: 'transparent' },
          content: 'brand',
        };
      case 'danger':
        return {
          container: { backgroundColor: colors.danger, borderColor: colors.danger },
          content: 'inkOnBrand',
        };
      case 'primary':
      default:
        return {
          container: { backgroundColor: colors.brand, borderColor: colors.brand },
          content: 'inkOnBrand',
        };
    }
  }, [variant, success, colors, borderWidths]);
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  /** Icon name shown before the label. */
  iconLeft,
  /** Icon name shown after the label. */
  iconRight,
  loading = false,
  success = false,
  disabled = false,
  /** Stretches to fill the parent - the default for primary CTAs. */
  fullWidth = true,
  haptic,
  style,
  accessibilityLabel,
  accessibilityHint,
  testID,
}) {
  const theme = useTheme();
  const tokens = SIZE_TOKENS[size] ?? SIZE_TOKENS.lg;
  const variantStyle = useVariantStyle(variant, success);

  // Weight the haptic by how consequential the button is, unless overridden.
  const resolvedHaptic =
    haptic ?? (variant === 'primary' ? 'medium' : variant === 'danger' ? 'warning' : 'light');

  const contentColor = theme.colors[variantStyle.content] ?? theme.colors.ink;

  return (
    <Touchable
      onPress={onPress}
      disabled={disabled}
      loading={loading}
      haptic={success ? null : resolvedHaptic}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      testID={testID}
      style={[
        styles.base,
        {
          height: theme.controlHeights[tokens.height],
          paddingHorizontal: theme.spacing[tokens.px],
          borderRadius: theme.radii[tokens.radius],
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        variantStyle.container,
        style,
      ]}
    >
      <View style={[styles.content, { gap: theme.spacing[tokens.gap] }]}>
        {loading ? (
          <ActivityIndicator size="small" color={contentColor} />
        ) : (
          <>
            {success ? (
              <Icon name="check" size={tokens.icon} color={variantStyle.content} />
            ) : (
              iconLeft && <Icon name={iconLeft} size={tokens.icon} color={variantStyle.content} />
            )}
            <Text variant={tokens.text} color={variantStyle.content} numberOfLines={1}>
              {label}
            </Text>
            {!success && iconRight && (
              <Icon name={iconRight} size={tokens.icon} color={variantStyle.content} />
            )}
          </>
        )}
      </View>
    </Touchable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Button;
