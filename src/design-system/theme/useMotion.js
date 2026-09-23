import { useMemo } from 'react';
import { useTheme } from './ThemeProvider';

/**
 * Motion config that already respects the OS Reduce Motion setting.
 *
 * Components must animate through this hook rather than importing the raw
 * tokens. When Reduce Motion is on, every duration collapses to 0 and springs
 * become critically damped and stiff, so state still *changes* - it just lands
 * immediately instead of travelling. That keeps the UI coherent (no missing
 * final states) while honouring the accessibility request in PRD s.18.
 */

const INSTANT_SPRING = { damping: 100, stiffness: 1000, mass: 0.1 };

export function useMotion() {
  const { motion, reduceMotion } = useTheme();

  return useMemo(() => {
    if (!reduceMotion) {
      return {
        reduceMotion: false,
        durations: motion.durations,
        springs: motion.springs,
        easings: motion.easings,
        pressScale: motion.pressScale,
        pressOpacity: motion.pressOpacity,
        /** True when decorative, non-essential motion (confetti, sheen) may run. */
        allowDecorative: true,
      };
    }

    const flatDurations = Object.fromEntries(
      Object.keys(motion.durations).map((key) => [key, 0])
    );
    const flatSprings = Object.fromEntries(
      Object.keys(motion.springs).map((key) => [key, INSTANT_SPRING])
    );

    return {
      reduceMotion: true,
      durations: flatDurations,
      springs: flatSprings,
      easings: motion.easings,
      // No scale change on press - substitute a subtle opacity shift instead.
      pressScale: 1,
      pressOpacity: 0.75,
      allowDecorative: false,
    };
  }, [motion, reduceMotion]);
}

export default useMotion;
