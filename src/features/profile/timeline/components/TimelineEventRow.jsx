import React from 'react';
import { View } from 'react-native';

import { Checkbox, Icon, Text, Touchable, Row } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';

import { TIMELINE_COPY } from '../lib/timelineConstants';
import { formatTimelineTime } from '../lib/timelineHelpers';

export function TimelineEventRow({ event, onToggle, onEdit, onRemove }) {
  const { colors, spacing } = useTheme();
  const titleColor = event.completed ? 'subtle' : 'ink';

  return (
    <Row align="flex-start" gap="sm" style={{ paddingVertical: spacing.sm }}>
      <Checkbox
        checked={Boolean(event.completed)}
        onChange={onToggle}
        label={TIMELINE_COPY.completedLabel(event.title)}
        style={{ paddingTop: spacing.xxs }}
      />
      <View style={{ flex: 1, gap: spacing.xxs }}>
        <Text variant="label" color="brand">
          {formatTimelineTime(event.time)}
        </Text>
        <Text
          variant="body"
          color={titleColor}
          style={event.completed ? { textDecorationLine: 'line-through' } : undefined}
        >
          {event.title}
        </Text>
        {event.owner ? (
          <Text variant="caption" color="muted">
            With {event.owner}
          </Text>
        ) : null}
        {event.note ? (
          <Text variant="caption" color="subtle">
            {event.note}
          </Text>
        ) : null}
      </View>
      <Row gap="xs" style={{ marginTop: -spacing.xs }}>
        <Touchable
          onPress={onEdit}
          accessibilityLabel={TIMELINE_COPY.editLabel(event.title)}
          style={{ padding: spacing.xs }}
        >
          <Icon name="edit" size="sm" color="inkMuted" />
        </Touchable>
        <Touchable
          onPress={onRemove}
          accessibilityLabel={TIMELINE_COPY.removeLabel(event.title)}
          style={{ padding: spacing.xs }}
        >
          <Icon name="trash" size="sm" color={colors.danger} />
        </Touchable>
      </Row>
    </Row>
  );
}
