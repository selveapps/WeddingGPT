import React from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';

import { Screen, Stack, Row, Text, Badge, ScreenHeader } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';

/**
 * Page shell for every Labs prototype: a back header, an "Experimental" badge
 * and an optional intro line, so it is always obvious you are outside the
 * finished app.
 */
export function LabScreen({ title, intro, children, footer }) {
  const { spacing } = useTheme();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen bottomInset={spacing.xxl} footer={footer}>
        <Stack gap="xl">
          <ScreenHeader eyebrow="Labs" title={title} />
          <Stack gap="xs">
            <Row>
              <Badge label="Experimental" tone="warning" />
            </Row>
            {intro ? (
              <Text variant="bodySm" color="muted">
                {intro}
              </Text>
            ) : null}
          </Stack>
          {children}
        </Stack>
      </Screen>
    </KeyboardAvoidingView>
  );
}

export default LabScreen;
