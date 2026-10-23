import React from 'react';
import { Button, Card, Chip, Row, Stack, Text } from '@/design-system/components';

const LABELS = { listed: 'Listed', reserved: 'Reserved', received: 'Received', thanked: 'Thank-you sent' };
const NEXT = { listed: 'reserved', reserved: 'received', received: 'thanked' };

export function RegistryGiftCard({ gift, onEdit, onRemove, onAdvance }) {
  return (
    <Card padding="md" testID={`registry-card-${gift.id}`}>
      <Stack gap="sm">
        <Row justify="space-between" align="flex-start" gap="sm">
          <Stack gap="xs" style={{ flex: 1 }}>
            <Text variant="labelStrong">{gift.item}</Text>
            <Text variant="bodySm" color="muted">
              {gift.store}
              {gift.price !== '' ? ` · $${Number(gift.price).toFixed(2)}` : ''}
            </Text>
          </Stack>
          <Chip
            label={LABELS[gift.status] || 'Listed'}
            size="sm"
            tone={gift.status === 'thanked' ? 'success' : 'warning'}
          />
        </Row>
        {gift.url ? (
          <Text variant="caption" color="brand" numberOfLines={1}>
            {gift.url}
          </Text>
        ) : null}
        <Row gap="xs" wrap>
          <Button label="Edit" variant="soft" size="sm" onPress={() => onEdit(gift)} />
          {NEXT[gift.status] ? (
            <Button
              label={`Mark ${LABELS[NEXT[gift.status]].toLowerCase()}`}
              variant="ghost"
              size="sm"
              onPress={() => onAdvance(gift, NEXT[gift.status])}
              accessibilityLabel={`Mark ${gift.item} ${LABELS[NEXT[gift.status]].toLowerCase()}`}
            />
          ) : null}
          <Button
            label="Remove"
            variant="ghost"
            size="sm"
            onPress={() => onRemove(gift.id)}
            accessibilityLabel={`Remove ${gift.item}`}
          />
        </Row>
      </Stack>
    </Card>
  );
}

export default RegistryGiftCard;
