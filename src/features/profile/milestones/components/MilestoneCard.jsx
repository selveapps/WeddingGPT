import React from 'react';

import { Button, Card, Chip, Row, Stack, Text } from '@/design-system/components';
import { milestoneTypeLabel } from '../lib/milestoneHelpers';

export function MilestoneCard({ milestone, onToggle, onRemove }) {
  return (
    <Card padding="md" tone={milestone.completed ? 'muted' : 'plain'}>
      <Stack gap="sm">
        <Row justify="space-between" align="flex-start" gap="sm">
          <Stack gap="xs" style={{ flex: 1 }}>
            <Text variant="labelStrong">{milestone.title}</Text>
            <Row gap="xs" align="center">
              <Chip
                label={milestoneTypeLabel(milestone.type)}
                size="sm"
                tone={milestone.completed ? 'success' : 'neutral'}
              />
              <Text variant="caption" color="subtle">
                {milestone.date}
              </Text>
            </Row>
          </Stack>
          <Button
            label={milestone.completed ? 'Reopen' : 'Done'}
            variant={milestone.completed ? 'secondary' : 'soft'}
            size="sm"
            onPress={() => onToggle(milestone.id, !milestone.completed)}
          />
        </Row>
        {milestone.note ? <Text variant="bodySm">{milestone.note}</Text> : null}
        <Button
          label="Remove"
          variant="ghost"
          size="sm"
          onPress={() => onRemove(milestone.id)}
          accessibilityLabel={`Remove milestone ${milestone.title}`}
        />
      </Stack>
    </Card>
  );
}

export default MilestoneCard;
