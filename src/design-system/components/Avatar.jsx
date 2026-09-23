import React, { useMemo } from 'react';
import { View, Image } from 'react-native';

import { useTheme } from '../theme';
import Text from './Text';
import Icon from './Icon';

/**
 * Avatar - initials, photo or icon in a circle.
 *
 * Guests rarely have photos, so the initials path is the primary one. The
 * background colour is derived deterministically from the name: the same guest
 * keeps the same colour across sessions and screens, which makes long lists
 * much easier to scan than a single flat grey.
 */

/** Tints chosen to stay legible against `inkOnBrand` in both schemes. */
const TINT_ROLES = ['brand', 'accent', 'success', 'info', 'warning'];

function hashString(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0; // force 32-bit
  }
  return Math.abs(hash);
}

export function initialsFrom(name) {
  if (!name || typeof name !== 'string') return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  name,
  /** Remote or local image source. Takes precedence over initials. */
  source,
  /** Fallback icon when there is no name and no image. */
  icon = 'user',
  size = 'md',
  /** Override the derived tint with a specific theme role. */
  tone,
  style,
  testID,
}) {
  const { colors, avatarSizes, radii } = useTheme();

  const px = typeof size === 'number' ? size : avatarSizes[size] ?? avatarSizes.md;
  const initials = useMemo(() => initialsFrom(name), [name]);

  const tintRole = useMemo(() => {
    if (tone) return tone;
    if (!name) return 'brand';
    return TINT_ROLES[hashString(name) % TINT_ROLES.length];
  }, [tone, name]);

  const base = {
    width: px,
    height: px,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  if (source) {
    return (
      <Image
        source={source}
        style={[base, { backgroundColor: colors.surfaceSunken }, style]}
        accessibilityLabel={name ? `${name}'s photo` : 'Photo'}
        testID={testID}
      />
    );
  }

  // Scale the glyph with the circle; these ratios keep initials optically centred.
  const textSize = Math.round(px * 0.38);

  return (
    <View
      style={[base, { backgroundColor: colors[tintRole] ?? colors.brand }, style]}
      testID={testID}
      accessible={Boolean(name)}
      accessibilityLabel={name}
    >
      {initials ? (
        <Text
          variant="labelStrong"
          color="inkOnBrand"
          style={{ fontSize: textSize, lineHeight: textSize * 1.2 }}
        >
          {initials}
        </Text>
      ) : (
        <Icon name={icon} size={Math.round(px * 0.5)} color="inkOnBrand" />
      )}
    </View>
  );
}

export default Avatar;
