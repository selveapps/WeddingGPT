import React from 'react';

import { Button, Card, Chip, Row, Stack, Text } from '@/design-system/components';
import { goalCategoryLabel, goalPriorityLabel } from '../lib/goalHelpers';

export function GoalCard({ goal, onComplete, onRemove }) {
  return (
    <Card padding="md" tone={goal.completed ? 'muted' : 'plain'}>
      <Stack gap="sm">
        <Row justify="space-between" align="flex-start" gap="sm">
          <Stack gap="xs" style={{ flex: 1 }}>
            <Text variant="labelStrong">{goal.title}</Text>
            <Row gap="xs" align="center" wrap>
              <Chip label={goalCategoryLabel(goal.category)} size="sm" />
              <Chip
                label={goalPriorityLabel(goal.priority)}
                size="sm"
                tone={goal.priority === 'soon' ? 'warning' : 'neutral'}
              />
              {goal.dueDate ? (
                <Text variant="caption" color="subtle">
                  By {goal.dueDate}
                </Text>
              ) : null}
            </Row>
          </Stack>
          <Button
            label={goal.completed ? 'Reopen' : 'Done'}
            variant={goal.completed ? 'secondary' : 'soft'}
            size="sm"
            onPress={() => onComplete(goal.id, !goal.completed)}
          />
        </Row>
        {goal.details ? <Text variant="bodySm">{goal.details}</Text> : null}
        <Button
          label="Remove"
          variant="ghost"
          size="sm"
          onPress={() => onRemove(goal.id)}
          accessibilityLabel={`Remove goal ${goal.title}`}
        />
      </Stack>
    </Card>
  );
}

export default GoalCard;
