import React from 'react';

import { Button, Card, Chip, Row, Stack, Text } from '@/design-system/components';
import { partyRoleLabel, partySideLabel } from '../lib/partyHelpers';

export function PartyMemberCard({ member, onRemove }) {
  return (
    <Card padding="md">
      <Stack gap="sm">
        <Row justify="space-between" align="flex-start" gap="sm">
          <Stack gap="xs" style={{ flex: 1 }}>
            <Text variant="labelStrong">{member.name}</Text>
            <Row gap="xs" wrap>
              <Chip label={partyRoleLabel(member.role)} size="sm" />
              <Chip label={partySideLabel(member.side)} size="sm" tone="accent" />
            </Row>
          </Stack>
          <Button
            label="Remove"
            variant="ghost"
            size="sm"
            onPress={() => onRemove(member.id)}
            accessibilityLabel={`Remove ${member.name} from wedding party`}
          />
        </Row>
        {member.email ? (
          <Text variant="caption" color="muted">
            {member.email}
          </Text>
        ) : null}
        {member.phone ? (
          <Text variant="caption" color="muted">
            {member.phone}
          </Text>
        ) : null}
        {member.note ? <Text variant="bodySm">{member.note}</Text> : null}
      </Stack>
    </Card>
  );
}

export default PartyMemberCard;
