import React from 'react';
import { View, StyleSheet } from 'react-native';

import { useTheme } from '../theme';
import Touchable from './Touchable';
import Text from './Text';
import Icon from './Icon';

/**
 * ListRow - the workhorse row used by guests, vendors, expenses, settings and
 * task lists.
 *
 * Deliberately generic in structure (leading slot / text stack / trailing slot)
 * but opinionated about metrics, so a settings row and a guest row have the
 * same height rhythm and the same 44pt touch target.
 *
 * Rows are inset by the card padding by default, because they almost always sit
 * in a `<Card padding="none">` list - without the inset the text runs right up
 * against the card edge. Pass `inset={false}` for a row that sits in an
 * already-padded container, such as a bottom sheet or a form.
 */
export function ListRow({
  title,
  subtitle,
  /** Small text on the right of the title line - amounts, dates, counts. */
  meta,
  /** Custom node rendered on the left (avatar, checkbox, colour swatch). */
  leading,
  /** Icon name shorthand for `leading`. */
  icon,
  /** Custom node rendered on the right (badge, switch, amount). */
  trailing,
  onPress,
  onLongPress,
  /** Shows a chevron. Defaults on when the row navigates somewhere. */
  showChevron,
  /** Horizontal padding matching the card padding. Off inside padded containers. */
  inset = true,
  /** How many lines the subtitle may wrap to before it truncates. */
  subtitleLines = 2,
  disabled = false,
  destructive = false,
  haptic = 'light',
  style,
  accessibilityLabel,
  accessibilityHint,
  testID,
}) {
  const { colors, spacing, minTouchTarget } = useTheme();

  const interactive = Boolean(onPress || onLongPress);
  const chevron = showChevron ?? (interactive && !trailing);

  const body = (
    <View style={[styles.row, { gap: spacing.md, minHeight: minTouchTarget }]}>
      {leading ?? (icon ? <Icon name={icon} color={destructive ? 'danger' : 'inkMuted'} /> : null)}

      <View style={{ flex: 1, gap: spacing.hair }}>
        <View style={styles.titleLine}>
          <Text
            variant="bodyStrong"
            color={destructive ? 'danger' : 'default'}
            numberOfLines={1}
            style={{ flex: 1 }}
          >
            {title}
          </Text>
          {meta && (
            <Text variant="caption" color="subtle" numberOfLines={1}>
              {meta}
            </Text>
          )}
        </View>
        {subtitle && (
          <Text variant="bodySm" color="muted" numberOfLines={subtitleLines}>
            {subtitle}
          </Text>
        )}
      </View>

      {trailing}
      {chevron && <Icon name="chevronRight" size="md" color={colors.inkSubtle} />}
    </View>
  );

  const containerStyle = [
    { paddingVertical: spacing.sm + spacing.hair, paddingHorizontal: inset ? spacing.lg : 0 },
    style,
  ];

  if (!interactive) {
    return (
      <View style={containerStyle} testID={testID}>
        {body}
      </View>
    );
  }

  return (
    <Touchable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      haptic={haptic}
      scaleOnPress={false}
      style={containerStyle}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint ?? subtitle}
      testID={testID}
    >
      {body}
    </Touchable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
});

export default ListRow;
