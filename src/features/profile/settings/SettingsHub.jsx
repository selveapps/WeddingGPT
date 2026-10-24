/**
 * SettingsHub — top-level settings screen: search + section links.
 */

import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import {
  Screen,
  Stack,
  Text,
  Card,
  ListRow,
  ScreenHeader,
  SectionHeader,
  TextField,
  Badge,
  Icon,
  useToast,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { Routes } from '@/navigation/routes';

import { useSettingsHub } from './hooks/useSettings';
import { SETTINGS_COPY } from './lib/settingsConstants';

export function SettingsHub() {
  const router = useRouter();
  const toast = useToast();
  const { colors, radii } = useTheme();
  const { query, setQuery, links, empty, summaries, copy } = useSettingsHub();

  const onPressLink = useCallback(
    (link) => {
      const path = Routes[link.routeKey];
      if (!path) {
        toast.info('That settings screen is not wired yet.');
        return;
      }
      router.push(path);
    },
    [router, toast]
  );

  return (
    <Screen testID="settings-hub" edges={['top', 'bottom']}>
      <ScreenHeader
        title={copy.hubTitle}
        subtitle={copy.hubSubtitle}
        onBack={() => router.back()}
      />
      <Stack gap="md" style={styles.body}>
        <TextField
          value={query}
          onChangeText={setQuery}
          placeholder={SETTINGS_COPY.searchPlaceholder}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          testID="settings-search"
          leading={<Icon name="search" size="sm" color="inkSubtle" />}
        />

        {empty ? (
          <Card>
            <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
              {SETTINGS_COPY.emptySearch}
            </Text>
          </Card>
        ) : (
          <Card padding="none" radius="xl">
            {links.map((link, index) => (
              <ListRow
                key={link.id}
                leading={
                  <View
                    style={[
                      styles.iconTile,
                      {
                        backgroundColor: colors.brandSoft,
                        borderRadius: radii.sm,
                      },
                    ]}
                  >
                    <Icon name={link.icon} size="sm" color="brandSoftInk" />
                  </View>
                }
                title={link.title}
                subtitle={link.summary || link.subtitle}
                trailing={
                  link.dirty ? (
                    <Badge label="Custom" tone="brand" />
                  ) : undefined
                }
                showChevron
                onPress={() => onPressLink(link)}
                testID={`settings-link-${link.id}`}
                style={
                  index === links.length - 1
                    ? undefined
                    : { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSubtle }
                }
              />
            ))}
          </Card>
        )}

        <SectionHeader
          eyebrow="Snapshot"
          title="At a glance"
          subtitle="Quick view of theme, alerts and privacy."
        />
        <Card>
          <Stack gap="sm">
            <View style={styles.snapshotRow}>
              <Text variant="caption" color="muted">
                Appearance
              </Text>
              <Text variant="body">{summaries.appearance}</Text>
            </View>
            <View style={styles.snapshotRow}>
              <Text variant="caption" color="muted">
                Notifications
              </Text>
              <Text variant="body">{summaries.notifications}</Text>
            </View>
            <View style={styles.snapshotRow}>
              <Text variant="caption" color="muted">
                Privacy
              </Text>
              <Text variant="body">{summaries.privacy}</Text>
            </View>
            {summaries.quietActive ? (
              <Text variant="caption" color="brand">
                Quiet hours are active right now.
              </Text>
            ) : null}
          </Stack>
        </Card>
      </Stack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  iconTile: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapshotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
});

export default SettingsHub;
