import React, { useEffect, useRef, useState } from 'react';

import { useMotion } from '../theme';
import Text from './Text';

/**
 * AnimatedNumber - counts a value up or down when it changes.
 *
 * The PRD asks for budget figures to animate rather than snap (s.17). This runs
 * the tween on the JS thread with rAF rather than in a Reanimated worklet, on
 * purpose: the displayed string needs the real currency formatter (grouping,
 * symbols), and that is not worklet-safe. At the handful of numbers
 * a screen shows at once, a JS tween is imperceptible - and it keeps formatting
 * logic in one place instead of duplicating a simplified version for the UI
 * thread.
 *
 * Under Reduce Motion the value is applied immediately.
 */
export function AnimatedNumber({
  value = 0,
  /** (n) => string. Defaults to a rounded integer. */
  format = (n) => String(Math.round(n)),
  duration,
  variant = 'numeric',
  /** Tween up from zero on first paint - for reveal moments, not for dashboards. */
  countUp = false,
  color,
  style,
  ...rest
}) {
  const motion = useMotion();
  const tweenDuration = duration ?? motion.durations.slow;

  const startsAtZero = countUp && tweenDuration > 0;
  const [display, setDisplay] = useState(startsAtZero ? 0 : value);
  const fromRef = useRef(startsAtZero ? 0 : value);
  const frameRef = useRef(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    // Never animate the very first paint - the opening value is not a "change" -
    // unless the caller asked for a count-up.
    if (!mountedRef.current && !startsAtZero) {
      mountedRef.current = true;
      fromRef.current = value;
      setDisplay(value);
      return undefined;
    }

    if (tweenDuration <= 0) {
      fromRef.current = value;
      setDisplay(value);
      return undefined;
    }

    mountedRef.current = true;
    const from = fromRef.current;
    const delta = value - from;
    if (delta === 0) {
      // A re-run after an interrupted tween: make sure we are showing the target.
      setDisplay(value);
      return undefined;
    }

    const start = Date.now();

    const tick = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(1, elapsed / tweenDuration);
      // easeOutCubic - fast departure, soft landing.
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + delta * eased;

      setDisplay(current);

      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      // Land on the true value if we are interrupted mid-tween, so the number
      // on screen is never a rounding artefact of a cancelled animation.
      fromRef.current = value;
    };
  }, [value, tweenDuration]);

  return (
    <Text variant={variant} color={color} style={style} {...rest}>
      {format(display)}
    </Text>
  );
}

export default AnimatedNumber;
