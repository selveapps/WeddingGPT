import React from 'react';

import { Button, Card, Chip, Row, Stack, Text } from '@/design-system/components';
import { decisionCategoryLabel } from '../lib/decisionHelpers';

export function DecisionCard({ decision, onDecide, onReopen, onRemove }) {
  return (
    <Card padding="md" tone={decision.status === 'decided' ? 'muted' : 'plain'}>
      <Stack gap="sm">
        <Row justify="space-between" align="flex-start" gap="sm">
          <Stack gap="xs" style={{ flex: 1 }}>
            <Text variant="labelStrong">{decision.question}</Text>
            <Row gap="xs" wrap>
              <Chip label={decisionCategoryLabel(decision.category)} size="sm" />
              <Chip
                label={decision.status === 'decided' ? 'Decided' : 'Open'}
                size="sm"
                tone={decision.status === 'decided' ? 'success' : 'warning'}
              />
            </Row>
          </Stack>
          <Button
            label={decision.status === 'decided' ? 'Reopen' : 'Remove'}
            variant="ghost"
            size="sm"
            onPress={() => (decision.status === 'decided' ? onReopen(decision.id) : onRemove(decision.id))}
          />
        </Row>
        {decision.revisitDate ? (
          <Text variant="caption" color="muted">
            Revisit by {decision.revisitDate}
          </Text>
        ) : null}
        <Stack gap="xs">
          {(decision.options ?? []).map((option) => (
            <Row key={option} justify="space-between" gap="xs">
              <Text variant="bodySm">{option}</Text>
              {decision.selectedOption === option ? (
                <Chip label="Chosen" selected size="sm" tone="success" />
              ) : decision.status === 'open' ? (
                <Button
                  label="Choose"
                  variant="soft"
                  size="sm"
                  onPress={() => onDecide(decision.id, option)}
                  accessibilityLabel={`Choose ${option}`}
                />
              ) : null}
            </Row>
          ))}
        </Stack>
        {decision.note ? (
          <Text variant="caption" color="muted">
            {decision.note}
          </Text>
        ) : null}
        {decision.status === 'decided' ? (
          <Button label="Remove decision" variant="ghost" size="sm" onPress={() => onRemove(decision.id)} />
        ) : null}
      </Stack>
    </Card>
  );
}

export default DecisionCard;
