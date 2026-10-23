import React from 'react';

import { Button, Card, Chip, Row, Stack, Text } from '@/design-system/components';
import { documentTypeLabel } from '../lib/documentHelpers';

export function DocumentRow({ document, onToggle, onRemove }) {
  return (
    <Card padding="md" tone={document.completed ? 'muted' : 'plain'}>
      <Stack gap="sm">
        <Row justify="space-between" align="flex-start" gap="sm">
          <Stack gap="xs" style={{ flex: 1 }}>
            <Text variant="labelStrong">{document.title || documentTypeLabel(document.type)}</Text>
            <Row gap="xs" align="center" wrap>
              <Chip label={documentTypeLabel(document.type)} size="sm" />
              {document.reviewDate ? (
                <Text variant="caption" color="subtle">
                  Review by {document.reviewDate}
                </Text>
              ) : null}
            </Row>
          </Stack>
          <Button
            label={document.completed ? 'Reopen' : 'Done'}
            variant={document.completed ? 'secondary' : 'soft'}
            size="sm"
            onPress={() => onToggle(document.id, !document.completed)}
          />
        </Row>
        {document.note ? <Text variant="bodySm">{document.note}</Text> : null}
        <Button
          label="Remove"
          variant="ghost"
          size="sm"
          onPress={() => onRemove(document.id)}
          accessibilityLabel={`Remove ${document.title || documentTypeLabel(document.type)}`}
        />
      </Stack>
    </Card>
  );
}

export default DocumentRow;
