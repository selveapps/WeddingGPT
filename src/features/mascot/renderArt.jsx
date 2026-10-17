import React from 'react';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import Animated, { useAnimatedProps } from 'react-native-reanimated';

/**
 * Draws an art node tree (`swanArt`, `appIconArt`) with react-native-svg.
 *
 * Nodes are `[tag, attributes, children?]`. Eyes marked `blink: true` follow
 * the optional `blink` shared value; without one they are drawn open.
 */

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

const COMPONENTS = {
  svg: Svg,
  g: G,
  circle: Circle,
  ellipse: Ellipse,
  path: Path,
  rect: Rect,
  defs: Defs,
  linearGradient: LinearGradient,
  radialGradient: RadialGradient,
  stop: Stop,
};

export function renderArt(node, blink = null, key = 'art') {
  if (!node) return null;
  const [tag, attrs = {}, children = []] = node;
  const { blink: blinks, ...props } = attrs;

  if (blinks && blink) return <BlinkingEye key={key} {...props} blink={blink} />;

  const Component = COMPONENTS[tag];
  if (!Component) return null;
  return (
    <Component key={key} {...props}>
      {children.length ? children.map((child, index) => renderArt(child, blink, `${key}.${index}`)) : null}
    </Component>
  );
}

/** An eye whose height follows the shared blink value. */
function BlinkingEye({ ry, blink, ...props }) {
  const animatedProps = useAnimatedProps(() => ({ ry: ry * blink.value }));
  return <AnimatedEllipse {...props} ry={ry} animatedProps={animatedProps} />;
}
