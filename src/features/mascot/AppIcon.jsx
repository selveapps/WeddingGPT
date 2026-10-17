import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg from 'react-native-svg';

import { useTheme } from '@/design-system/theme';
import { appIconArt, APP_ICON_CORNER, APP_ICON_SIZE, APP_ICON_VIEWBOX } from './appIconArt';
import { renderArt } from './renderArt';

/**
 * The app icon, drawn in the app - pixel-for-pixel the same tile as the home
 * screen and App Store icon (both come from `appIconArt`). Use it anywhere the
 * app shows its logo, so the brand looks the same from the store to the app.
 *
 * `blink` is an optional shared value (1 open, 0 shut) for the swans' eyes.
 */
export function AppIcon({ size = 64, shadow = true, blink = null, style }) {
  const { shadows } = useTheme();
  const art = useMemo(() => appIconArt({ radius: APP_ICON_CORNER }), []);
  const corner = (APP_ICON_CORNER / APP_ICON_SIZE) * size;

  return (
    <View
      style={[{ width: size, height: size, borderRadius: corner }, shadow ? shadows.md : null, style]}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width={size} height={size} viewBox={APP_ICON_VIEWBOX}>
        {renderArt(art, blink, 'app-icon')}
      </Svg>
    </View>
  );
}

export default AppIcon;
