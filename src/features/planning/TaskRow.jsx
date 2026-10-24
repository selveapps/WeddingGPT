import React from 'react';

import { Badge, Checkbox, Icon, Row, Stack, Text, Touchable } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { isTaskOpen, isTaskOverdue, TASK_PRIORITY_META, TaskPriority } from '@/models';
import { formatRelativeDay } from '@/lib/date';

export function TaskRow({ task, categoryName, waitingFor = 0, onToggle, onPress }) {
  const { spacing } = useTheme();
  const open = isTaskOpen(task);
  const overdue = isTaskOverdue(task);
  const dueLabel = task.dueDate ? formatRelativeDay(task.dueDate) : null;
  const priority = TASK_PRIORITY_META[task.priority];

  return (
    <Row gap="md" style={{ paddingHorizontal: spacing.sm, paddingVertical: spacing.sm }}>
      <Checkbox
        checked={!open}
        onChange={() => onToggle(task)}
        label={open ? `Mark ${task.title} as done` : `Mark ${task.title} as not done`}
      />
      <Touchable
        onPress={onPress}
        scaleOnPress={false}
        haptic="light"
        accessibilityLabel={task.title}
        accessibilityHint="Opens this task"
        style={{ flex: 1 }}
      >
        <Row gap="sm" align="center">
          <Stack gap="xs" style={{ flex: 1 }}>
            <Text
              variant="body"
              color={open ? 'default' : 'subtle'}
              numberOfLines={2}
              style={open ? null : { textDecorationLine: 'line-through' }}
            >
              {task.title}
            </Text>
            <Row gap="xs" wrap align="center">
              {categoryName ? (
                <Text variant="caption" color="subtle" numberOfLines={1}>
                  {categoryName}
                </Text>
              ) : null}
              {categoryName && dueLabel && open ? (
                <Text variant="caption" color="subtle">
                  ·
                </Text>
              ) : null}
              {dueLabel && open ? (
                <Text variant="caption" color={overdue ? 'danger' : 'muted'}>
                  {overdue ? dueLabel : `Due ${dueLabel.toLowerCase()}`}
                </Text>
              ) : null}
              {waitingFor > 0 ? (
                <Badge
                  label={`Waiting on ${waitingFor} ${waitingFor === 1 ? 'task' : 'tasks'}`}
                  tone="warning"
                />
              ) : null}
              {task.priority === TaskPriority.HIGH && priority ? (
                <Badge label={priority.label} tone={priority.tone} />
              ) : null}
            </Row>
          </Stack>
          <Icon name="chevronRight" size="sm" color="inkSubtle" />
        </Row>
      </Touchable>
    </Row>
  );
}

export default TaskRow;
