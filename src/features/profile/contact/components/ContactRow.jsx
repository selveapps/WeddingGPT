import React from 'react';

import {
  Avatar,
  Badge,
  Button,
  Card,
  Row,
  Stack,
  Text,
} from '@/design-system/components';
import { VENDOR_CATEGORIES, VENDOR_STATUS_META } from '@/models';

export function ContactRow({ contact, onOpen, onEmail, onCall, onWebsite }) {
  const category = VENDOR_CATEGORIES.find((item) => item.key === contact.categoryKey);
  const status = VENDOR_STATUS_META[contact.status] ?? VENDOR_STATUS_META.saved;
  const displayName = contact.contactName || contact.name || 'Vendor contact';

  return (
    <Card padding="md">
      <Stack gap="sm">
        <Row gap="sm" align="center">
          <Avatar name={displayName} icon={category?.icon ?? 'vendors'} size="md" />
          <Stack gap="xxs" style={{ flex: 1 }}>
            <Text variant="body" numberOfLines={1}>{displayName}</Text>
            {contact.contactName ? (
              <Text variant="caption" color="muted" numberOfLines={1}>{contact.name}</Text>
            ) : null}
            <Text variant="caption" color="subtle" numberOfLines={1}>
              {[category?.name, contact.city].filter(Boolean).join(' · ')}
            </Text>
          </Stack>
          <Badge label={status.label} tone={status.tone} />
        </Row>

        <Row gap="xs" wrap align="flex-start">
          {contact.email ? (
            <Button
              label="Email"
              iconLeft="mail"
              size="sm"
              variant="secondary"
              fullWidth={false}
              onPress={() => onEmail?.(contact)}
              accessibilityLabel={`Email ${displayName}`}
            />
          ) : null}
          {contact.phone ? (
            <Button
              label="Call"
              iconLeft="phone"
              size="sm"
              variant="secondary"
              fullWidth={false}
              onPress={() => onCall?.(contact)}
              accessibilityLabel={`Call ${displayName}`}
            />
          ) : null}
          {contact.website ? (
            <Button
              label="Website"
              iconLeft="location"
              size="sm"
              variant="secondary"
              fullWidth={false}
              onPress={() => onWebsite?.(contact)}
              accessibilityLabel={`Open ${displayName} website`}
            />
          ) : null}
          <Button
            label="Booking details"
            size="sm"
            variant="ghost"
            fullWidth={false}
            onPress={() => onOpen?.(contact)}
          />
        </Row>
      </Stack>
    </Card>
  );
}

export default ContactRow;
