import React from 'react';
import { View } from 'react-native';

import { Checkbox, Chip, Icon, Row, Stack, Text, Touchable } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';

import { DAY_CHECKLIST_PRIORITIES } from '../lib/dayChecklistConstants';
import { dayChecklistCategoryLabel } from '../lib/dayChecklistHelpers';

export function DayChecklistTaskRow({ task, onToggle, onEdit, onRemove }) {
  const { colors, spacing } = useTheme();
  const priority = DAY_CHECKLIST_PRIORITIES.find((item) => item.value === task.priority);

  return (
    <Row align="flex-start" gap="sm" style={{ paddingVertical: spacing.sm }}>
      <Checkbox
        checked={Boolean(task.completed)}
        onChange={onToggle}
        label={`Mark ${task.title} ${task.completed ? 'to do' : 'done'}`}
        style={{ paddingTop: spacing.xxs }}
      />
      <Stack gap="xs" style={{ flex: 1 }}>
        <Text
          variant="bodyStrong"
          color={task.completed ? 'subtle' : 'ink'}
          style={task.completed ? { textDecorationLine: 'line-through' } : undefined}
        >
          {task.title}
        </Text>
        <Row gap="xs" wrap align="center">
          <Chip label={dayChecklistCategoryLabel(task.category)} size="sm" />
          {task.time ? <Chip label={task.time} icon="clock" size="sm" /> : null}
          {priority?.value === 'high' && !task.completed ? (
            <Chip label={priority.label} selected size="sm" />
          ) : null}
        </Row>
        {task.owner ? (
          <Text variant="caption" color="muted">
            Owner: {task.owner}
          </Text>
        ) : null}
        {task.note ? (
          <Text variant="caption" color="subtle">
            {task.note}
          </Text>
        ) : null}
      </Stack>
      <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: -spacing.xs }}>
        <Touchable
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${task.title}`}
          style={{ padding: spacing.xs }}
        >
          <Icon name="edit" size="sm" color="inkMuted" />
        </Touchable>
        <Touchable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${task.title}`}
          style={{ padding: spacing.xs }}
        >
          <Icon name="trash" size="sm" color={colors.danger} />
        </Touchable>
      </View>
    </Row>
  );
}

export default DayChecklistTaskRow;
