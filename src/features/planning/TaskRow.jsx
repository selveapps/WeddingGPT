import React from 'react';
import { View } from 'react-native';

import { Row, Stack, Text, Checkbox, Badge, Touchable, Icon } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { TaskStatus, TaskPriority, isTaskOverdue, isSnoozeActive } from '@/models';
import { formatRelativeDay } from '@/lib/date';

/**
 * One task in a list.
 *
 * The checkbox and the row body are separate targets on purpose: ticking a task
 * off is the single most common action in the app and must never be one
 * mis-tap away from navigating to a detail screen instead.
 *
 * Overdue is computed here rather than stored, so a row that was fine last
 * night is red this morning without anything having to run in between.
 */
export function TaskRow({ task, categoryName, onToggle, onPress }) {
  const { colors, spacing, borderWidths } = useTheme();

  const done = task.status === TaskStatus.DONE;
  const overdue = isTaskOverdue(task);
  const snoozed = isSnoozeActive(task);

  const dueColor = overdue ? 'danger' : snoozed ? 'subtle' : 'muted';

  return (
    <Row
      gap="sm"
      align="flex-start"
      style={{
        paddingVertical: spacing.sm,
        borderBottomWidth: borderWidths.hairline,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ paddingTop: spacing.hair }}>
        <Checkbox
          checked={done}
          onChange={() => onToggle?.(task)}
          accessibilityLabel={done ? `Mark ${task.title} as not done` : `Mark ${task.title} as done`}
        />
      </View>

      <Touchable
        onPress={() => onPress?.(task)}
        scaleOnPress={false}
        haptic="light"
        accessibilityLabel={task.title}
        accessibilityHint="Opens this task"
        style={{ flex: 1 }}
      >
        <Row gap="xs" align="center">
          <Stack gap="hair" style={{ flex: 1 }}>
            <Text
              variant="body"
              color={done ? 'subtle' : 'default'}
              numberOfLines={2}
              style={done ? { textDecorationLine: 'line-through' } : null}
            >
              {task.title}
            </Text>

            <Row gap="xs" wrap>
              {task.dueDate && !done ? (
                <Text variant="caption" color={dueColor}>
                  {snoozed ? `Snoozed until ${formatRelativeDay(task.snoozedUntil)}` : formatRelativeDay(task.dueDate)}
                </Text>
              ) : null}

              {categoryName ? (
                <Text variant="caption" color="subtle">
                  {task.dueDate && !done ? '· ' : ''}
                  {categoryName}
                </Text>
              ) : null}
            </Row>
          </Stack>

          {task.priority === TaskPriority.HIGH && !done ? (
            <Badge label="High" tone="warning" />
          ) : null}

          <Icon name="chevronRight" size="sm" color="inkSubtle" />
        </Row>
      </Touchable>
    </Row>
  );
}

export default TaskRow;
