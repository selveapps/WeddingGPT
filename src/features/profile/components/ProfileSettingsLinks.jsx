import React, { useMemo } from 'react';
import { useRouter } from 'expo-router';

import { Stack, Card, ListRow, SectionHeader, useToast } from '@/design-system/components';
import { Routes } from '@/navigation/routes';

import { PROFILE_COPY, PROFILE_SETTINGS_LINKS } from '../lib/profileConstants';

/**
 * Secondary destinations under the profile form.
 *
 * Only links that already have a screen are pressable. Coming-soon rows stay
 * visible (so the account map is honest) but toast a gentle "soon" instead of
 * navigating into a missing route.
 */
export function ProfileSettingsLinks({ style }) {
  const router = useRouter();
  const toast = useToast();

  const links = useMemo(() => PROFILE_SETTINGS_LINKS, []);

  const onPress = (link) => {
    const enabled = link.enabled !== false;
    const route = Routes[link.routeKey];
    if (!enabled || typeof route !== 'string') {
      toast.info('That screen is on the way.');
      return;
    }
    router.push(route);
  };

  return (
    <Stack gap="sm" style={style} testID="profile-settings-links">
      <SectionHeader
        eyebrow={PROFILE_COPY.settingsEyebrow}
        title={PROFILE_COPY.settingsTitle}
        subtitle={PROFILE_COPY.settingsSubtitle}
      />
      <Card padding="none">
        {links.map((link) => (
          <ListRow
            key={link.id}
            icon={link.icon}
            title={link.title}
            subtitle={link.subtitle}
            onPress={() => onPress(link)}
          />
        ))}
      </Card>
    </Stack>
  );
}

export default ProfileSettingsLinks;
