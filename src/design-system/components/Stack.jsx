import React from 'react';
import { View } from 'react-native';

import { useTheme } from '../theme';
import { space } from '../tokens/spacing';

/**
 * Stack / Row - thin layout primitives.
 *
 * Their only job is to let a screen express "these things sit in a column with
 * md spacing" without hand-writing a StyleSheet entry and a raw pixel gap each
 * time. They take spacing *tokens*, which is the point: a screen that reaches
 * for a number instead has to do it deliberately.
 */

export function Stack({
  children,
  gap = 'md',
  align,
  justify,
  padding,
  style,
  ...rest
}) {
  const { spacing } = useTheme();

  return (
    <View
      style={[
        {
          flexDirection: 'column',
          gap: space(gap),
          alignItems: align,
          justifyContent: justify,
          padding: padding ? spacing[padding] ?? padding : undefined,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

export function Row({
  children,
  gap = 'sm',
  align = 'center',
  justify,
  wrap = false,
  padding,
  style,
  ...rest
}) {
  const { spacing } = useTheme();

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          gap: space(gap),
          alignItems: align,
          justifyContent: justify,
          flexWrap: wrap ? 'wrap' : 'nowrap',
          padding: padding ? spacing[padding] ?? padding : undefined,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

/** Pushes siblings apart inside a Row. */
export function Spacer({ size }) {
  return <View style={size ? { width: space(size), height: space(size) } : { flex: 1 }} />;
}

export default Stack;
