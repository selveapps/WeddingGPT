import React, { useMemo } from 'react';
import { View } from 'react-native';

import { Stack, Row, Card, Text, Icon, SectionHeader } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';

import { buildSnapshotTiles } from '../lib/profileHelpers';
import { PROFILE_LAYOUT_COPY } from '../lib/profileConstants';

/**
 * At-a-glance grid of the wedding facts.
 *
 * Two-column tiles instead of a long list, so date, place, guests and budget
 * can be scanned in one look. Filled tiles are calm; empty ones are dashed and
 * read "Add", and tapping them opens the form section that fills them in.
 */
export function ProfileSummaryCard({ values, onTilePress, style }) {
  const { colors, spacing, radii } = useTheme();
  const tiles = useMemo(() => buildSnapshotTiles(values), [values]);

  return (
    <Stack gap="sm" style={style} testID="profile-summary">
      <SectionHeader
        eyebrow={PROFILE_LAYOUT_COPY.snapshotEyebrow}
        title={PROFILE_LAYOUT_COPY.snapshotTitle}
        subtitle={PROFILE_LAYOUT_COPY.snapshotSubtitle}
      />

      <Row gap="sm" wrap align="stretch">
        {tiles.map((tile) => {
          const pressable = Boolean(onTilePress && tile.section);
          return (
            <Card
              key={tile.id}
              tone={tile.empty ? 'outline' : 'plain'}
              padding="md"
              radius="lg"
              onPress={pressable ? () => onTilePress(tile.section) : undefined}
              accessibilityLabel={`${tile.title}: ${tile.empty ? 'not set, tap to add' : tile.value}`}
              style={{ flexGrow: 1, flexBasis: '45%', minHeight: 96 }}
              testID={`profile-summary-${tile.id}`}
            >
              <Stack gap="xs">
                <Row justify="space-between">
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: radii.pill,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: tile.empty ? colors.surfaceSunken : colors.brandSoft,
                    }}
                  >
                    <Icon
                      name={tile.icon}
                      size="sm"
                      color={tile.empty ? 'inkSubtle' : 'brandSoftInk'}
                    />
                  </View>
                  {tile.empty ? (
                    <Row gap="hair">
                      <Icon name="plus" size="xs" color="brand" />
                      <Text variant="caption" color="brand">
                        Add
                      </Text>
                    </Row>
                  ) : tile.meta ? (
                    <Text variant="caption" color="subtle" numberOfLines={1} style={{ flexShrink: 1, marginLeft: spacing.xs }}>
                      {tile.meta}
                    </Text>
                  ) : null}
                </Row>
                <Stack gap="hair">
                  <Text variant="caption" color="subtle">
                    {tile.title}
                  </Text>
                  <Text
                    variant="bodyStrong"
                    color={tile.empty ? 'subtle' : 'default'}
                    numberOfLines={2}
                  >
                    {tile.value}
                  </Text>
                </Stack>
              </Stack>
            </Card>
          );
        })}
      </Row>
    </Stack>
  );
}

export default ProfileSummaryCard;
