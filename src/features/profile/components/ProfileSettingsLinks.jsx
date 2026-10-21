import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { Stack, Card, ListRow, Badge, Icon, SectionHeader, useToast } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { Routes } from '@/navigation/routes';

import {
  PROFILE_COPY,
  PROFILE_SETTINGS_LINKS,
  PROFILE_LAYOUT_COPY,
} from '../lib/profileConstants';

function isAvailable(link) {
  return link.enabled !== false && typeof Routes[link.routeKey] === 'string';
}

/**
 * Secondary destinations under the profile form.
 *
 * Each row gets a tinted icon tile. Rows without a screen yet stay visible
 * (so the account map is honest) with a "Soon" badge, and toast a gentle
 * note instead of navigating into a missing route.
 */
export function ProfileSettingsLinks({ style }) {
  const router = useRouter();
  const toast = useToast();
  const { colors, radii } = useTheme();

  const onPress = (link) => {
    if (!isAvailable(link)) {
      toast.info('That screen is on the way.');
      return;
    }
    router.push(Routes[link.routeKey]);
  };

  return (
    <Stack gap="sm" style={style} testID="profile-settings-links">
      <SectionHeader
        eyebrow={PROFILE_COPY.settingsEyebrow}
        title={PROFILE_COPY.settingsTitle}
        subtitle={PROFILE_COPY.settingsSubtitle}
      />
      <Card padding="none" radius="xl">
        {PROFILE_SETTINGS_LINKS.map((link) => {
          const available = isAvailable(link);
          return (
            <ListRow
              key={link.id}
              leading={
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: radii.sm,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: available ? colors.brandSoft : colors.surfaceSunken,
                  }}
                >
                  <Icon
                    name={link.icon}
                    size="sm"
                    color={available ? 'brandSoftInk' : 'inkSubtle'}
                  />
                </View>
              }
              title={link.title}
              subtitle={link.subtitle}
              trailing={
                available ? undefined : <Badge label={PROFILE_LAYOUT_COPY.soonLabel} tone="neutral" />
              }
              showChevron={available}
              onPress={() => onPress(link)}
              testID={`profile-link-${link.id}`}
            />
          );
        })}
      </Card>
    </Stack>
  );
}

export default ProfileSettingsLinks;
