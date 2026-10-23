import React from 'react';
import { Button, Card, Chip, Row, Stack, Text } from '@/design-system/components';

export function GuestRsvpCard({ guest, onEdit, onRemove }) {
  const status = { yes: 'Attending', no: 'Declined', pending: 'Pending' }[guest.rsvp] || 'Pending';
  return (
    <Card padding="md">
      <Stack gap="sm" testID={`guest-rsvp-card-${guest.id}`}>
        <Row justify="space-between" align="flex-start" gap="sm">
          <Stack gap="xs" style={{ flex: 1 }}>
            <Text variant="labelStrong">{guest.name}</Text>
            <Row gap="xs" wrap>
              <Chip label={status} size="sm" />
              <Chip
                label={`${guest.partySize} ${Number(guest.partySize) === 1 ? 'guest' : 'guests'}`}
                size="sm"
                tone="accent"
              />
            </Row>
          </Stack>
          <Row gap="xs">
            <Button
              label="Edit"
              variant="ghost"
              size="sm"
              onPress={() => onEdit(guest)}
              accessibilityLabel={`Edit ${guest.name}`}
            />
            <Button
              label="Remove"
              variant="ghost"
              size="sm"
              onPress={() => onRemove(guest.id)}
              accessibilityLabel={`Remove ${guest.name}`}
            />
          </Row>
        </Row>
        {guest.meal ? (
          <Text variant="caption" color="muted">
            Meal: {guest.meal}
          </Text>
        ) : null}
        {guest.notes ? <Text variant="bodySm">{guest.notes}</Text> : null}
      </Stack>
    </Card>
  );
}

export default GuestRsvpCard;
