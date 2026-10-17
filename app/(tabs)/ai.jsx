import React, { useState } from 'react';
import { useRouter } from 'expo-router';

import {
  Screen,
  Stack,
  Row,
  Text,
  Card,
  Icon,
  Chip,
  ListRow,
  SectionHeader,
  ConfirmSheet,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { Routes } from '@/navigation/routes';
import { useAIStore, selectConversations } from '@/store';
import { aiService, PROMPT_TEMPLATES, PROMPT_GROUPS } from '@/services/ai';
import { formatRelativeDay, toISODate } from '@/lib/date';
import { ContextChips } from '@/features/assistant/ContextChips';
import { Mascot } from '@/features/mascot/Mascot';
import { NotificationBell } from '@/features/notifications/NotificationBell';

/**
 * Assistant home (PRD s.12): start a conversation, pick up a recent one, or
 * tap a suggested question. Suggested prompts cover every capability group in
 * the PRD, including questions about using the app itself.
 */
export default function AssistantScreen() {
  const router = useRouter();
  const { spacing, colors } = useTheme();

  const conversations = useAIStore(selectConversations);
  const deleteConversation = useAIStore((state) => state.deleteConversation);
  const [pendingDelete, setPendingDelete] = useState(null);

  const isRemote = aiService.mode === 'remote';

  return (
    <Screen bottomInset={spacing.xxl}>
      <Stack gap="xl">
        <Stack gap="xxs">
          <Row gap="sm">
            <Mascot size={56} mood="wave" />
            <Stack gap="hair" style={{ flex: 1 }}>
              <Text variant="eyebrow" color="accent">
                Your wedding assistant
              </Text>
              <Text variant="h1" heading>
                Ask anything
              </Text>
            </Stack>
            <NotificationBell />
          </Row>
          <Text variant="body" color="muted">
            It knows your date, your budget and where your plan stands - so you do not have to explain
            yourself first.
          </Text>
        </Stack>

        <Card tone="brand" onPress={() => router.push(Routes.assistantNew())} accessibilityLabel="Start a new conversation">
          <Row gap="sm">
            <Icon name="sparkle" size="xl" color={colors.brandSoftInk} />
            <Stack gap="hair" style={{ flex: 1 }}>
              <Text variant="h3">Start a conversation</Text>
              <Text variant="bodySm" color="muted">
                Planning, budget, guests, vendors, etiquette - or help with the app.
              </Text>
            </Stack>
            <Icon name="chevronRight" color={colors.brandSoftInk} />
          </Row>
        </Card>

        <ContextChips />

        {conversations.length > 0 ? (
          <Stack gap="sm">
            <SectionHeader eyebrow="Pick up where you left off" title="Recent conversations" />
            <Card padding="none">
              {conversations.slice(0, 6).map((conversation) => (
                <ListRow
                  key={conversation.id}
                  icon="sparkle"
                  title={conversation.title}
                  subtitle={
                    conversation.lastMessageAt
                      ? formatRelativeDay(toISODate(new Date(conversation.lastMessageAt)))
                      : 'Just started'
                  }
                  onPress={() => router.push(Routes.assistantChat(conversation.id))}
                  onLongPress={() => setPendingDelete(conversation)}
                  accessibilityHint="Long-press to delete"
                />
              ))}
            </Card>
          </Stack>
        ) : null}

        <Stack gap="md">
          <SectionHeader eyebrow="Try asking" title="Suggested questions" />
          {PROMPT_GROUPS.map((group) => (
            <Stack key={group} gap="xs">
              <Text variant="label" color="subtle">
                {group}
              </Text>
              <Stack gap="xs" align="flex-start">
                {PROMPT_TEMPLATES.filter((t) => t.group === group).map((template) => (
                  <Chip
                    key={template.id}
                    label={template.label}
                    icon={template.icon}
                    onPress={() => router.push(Routes.assistantNew(template.label))}
                  />
                ))}
              </Stack>
            </Stack>
          ))}
        </Stack>

        <Card tone="sunken" padding="sm">
          <Row gap="sm" align="flex-start">
            <Icon name="lock" size="md" color="inkMuted" />
            <Text variant="caption" color="muted" style={{ flex: 1 }}>
              {isRemote
                ? 'Answers come from Claude, with a short summary of your plan - counts and totals, never guest names or contact details. '
                : 'Answers come from the assistant built into this app, and nothing leaves your device. '}
              WeddingGPT only suggests changes - nothing is added to your plan until you confirm it.
            </Text>
          </Row>
        </Card>
      </Stack>

      <ConfirmSheet
        visible={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          deleteConversation(pendingDelete.id);
          setPendingDelete(null);
        }}
        destructive
        icon="trash"
        title="Delete this conversation?"
        message={`"${pendingDelete?.title ?? ''}" will be removed. Tasks you already added to your plan stay.`}
        confirmLabel="Delete"
      />
    </Screen>
  );
}
