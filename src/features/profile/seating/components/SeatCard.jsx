import React from 'react';
import { Button, Card, Chip, Row, Stack, Text } from '@/design-system/components';

export function SeatCard({ record, onEdit, onRemove }) {
  const position = [record.table, record.seat && `Seat ${record.seat}`].filter(Boolean).join(' · ');
  return (
    <Card padding="md">
      <Stack gap="sm" testID={`seating-card-${record.id}`}>
        <Row justify="space-between" align="flex-start" gap="sm">
          <Stack gap="xs" style={{ flex: 1 }}>
            <Text variant="labelStrong">{record.guest}</Text>
            <Chip label={position || 'Unassigned'} size="sm" tone={position ? 'accent' : 'neutral'} />
          </Stack>
          <Row gap="xs">
            <Button
              label="Edit"
              variant="ghost"
              size="sm"
              onPress={() => onEdit(record)}
              accessibilityLabel={`Edit seat for ${record.guest}`}
            />
            <Button
              label="Remove"
              variant="ghost"
              size="sm"
              onPress={() => onRemove(record.id)}
              accessibilityLabel={`Remove ${record.guest}`}
            />
          </Row>
        </Row>
        {record.note ? <Text variant="bodySm">{record.note}</Text> : null}
      </Stack>
    </Card>
  );
}

export default SeatCard;
