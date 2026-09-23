import React from 'react';

import { Screen, Stack, Text, Card, Row, Icon, Chip } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';

/** Starter prompts, grouped the way the PRD groups AI capabilities (s.12). */
const SUGGESTED_PROMPTS = [
  'What should I be doing three months out?',
  'Draft a message asking our venue about parking',
  'Explain where most of our budget is going',
  'Build a timeline for the wedding day',
  'How do we word a no-children invitation?',
];

/**
 * Assistant tab.
 *
 * Phase 1 ships the entry point and the suggested-prompt surface. The chat
 * itself, the wedding-context system, conversation persistence and the
 * confirmation workflow for proposed changes all arrive in Phase 4.
 */
export default function AssistantScreen() {
  const { spacing, colors } = useTheme();

  return (
    <Screen bottomInset={spacing.xxl}>
      <Stack gap="lg">
        <Stack gap="xxs">
          <Text variant="eyebrow" color="accent">
            WeddingGPT
          </Text>
          <Text variant="h1" heading>
            Ask anything
          </Text>
          <Text variant="body" color="muted">
            It knows your date, your budget and where your plan stands - so you
            do not have to explain yourself first.
          </Text>
        </Stack>

        <Card tone="accent">
          <Row gap="sm">
            <Icon name="lock" size="lg" color={colors.accentSoftInk} />
            <Text variant="bodySm" color="muted" style={{ flex: 1 }}>
              Coming in the next build. Nothing you tell it will change your
              workspace without you confirming it first.
            </Text>
          </Row>
        </Card>

        <Stack gap="sm">
          <Text variant="eyebrow" color="subtle">
            Things you will be able to ask
          </Text>
          <Stack gap="xs" align="flex-start">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <Chip key={prompt} label={prompt} icon="sparkle" />
            ))}
          </Stack>
        </Stack>
      </Stack>
    </Screen>
  );
}
