import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Screen, ScreenHeader, Stack, Text, Chip, EmptyState } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { useAIStore, selectMessageCollection, selectConversationById } from '@/store';
import { MessageStatus, denormalise } from '@/models';
import { PROMPT_TEMPLATES } from '@/services/ai';
import { Routes } from '@/navigation/routes';
import { MessageBubble } from '@/features/assistant/MessageBubble';
import { Composer } from '@/features/assistant/Composer';
import { ContextChips } from '@/features/assistant/ContextChips';
import { Mascot } from '@/features/mascot/Mascot';

const STARTERS = PROMPT_TEMPLATES.slice(0, 5);

/**
 * A conversation with WeddingGPT (PRD s.12).
 *
 * `/assistant/new` is a blank chat; the conversation is created by the first
 * message, and the URL is swapped for the real ID so back-navigation and
 * re-opening land in the same place. `?prompt=` sends a starter question on
 * open, which is how the suggested prompts on the Assistant tab work.
 */
export default function ConversationScreen() {
  const router = useRouter();
  const { spacing } = useTheme();
  const params = useLocalSearchParams();

  const [conversationId, setConversationId] = useState(params.id === 'new' ? null : params.id);
  const conversation = useAIStore(selectConversationById(conversationId));
  const allMessages = useAIStore(selectMessageCollection);
  const sendMessage = useAIStore((state) => state.sendMessage);
  const retry = useAIStore((state) => state.retry);

  const messages = useMemo(
    () => denormalise(allMessages).filter((m) => m.conversationId === conversationId),
    [allMessages, conversationId]
  );

  const last = messages[messages.length - 1];
  const busy = last?.status === MessageStatus.PENDING || last?.status === MessageStatus.STREAMING;

  const send = useCallback(
    (text) => {
      const id = sendMessage({ conversationId, text });
      if (id && id !== conversationId) {
        setConversationId(id);
        router.setParams({ id, prompt: '' });
      }
    },
    [conversationId, router, sendMessage]
  );

  // A starter prompt is sent exactly once, even if the screen re-renders.
  const sentPrompt = useRef(false);
  useEffect(() => {
    if (sentPrompt.current || !params.prompt || conversationId) return;
    sentPrompt.current = true;
    send(String(params.prompt));
  }, [params.prompt, conversationId, send]);

  const listRef = useRef(null);
  const scrollToEnd = useCallback(() => listRef.current?.scrollToEnd({ animated: true }), []);

  const missing = conversationId && !conversation && messages.length === 0;

  return (
    <Screen scroll={false} footer={missing ? null : <Composer onSend={send} busy={busy} autoFocus={!params.prompt && !conversationId} />}>
      <ScreenHeader
        eyebrow="WeddingGPT"
        title={conversation?.title ?? 'New conversation'}
        onBack={() => (router.canGoBack() ? router.back() : router.replace(Routes.ai))}
        actionIcon={messages.length ? 'plus' : undefined}
        actionLabel="Start a new conversation"
        onActionPress={() => router.replace(Routes.assistantNew())}
      />

      {missing ? (
        <EmptyState
          icon="sparkle"
          title="This conversation is gone"
          message="It may have been deleted. Start a fresh one - WeddingGPT still knows your plan."
          actionLabel="New conversation"
          onAction={() => router.replace(Routes.assistantNew())}
        />
      ) : messages.length === 0 ? (
        <Stack gap="lg" style={{ flex: 1, justifyContent: 'center' }}>
          <Stack gap="xs">
            <Mascot size={72} mood="wave" />
            <Text variant="h2" heading>
              Hi there! How can I help?
            </Text>
            <Text variant="body" color="muted">
              Ask about your plan, budget, guests, vendors or etiquette - or ask me to draft a message or a
              checklist. Nothing changes in your workspace without your say-so.
            </Text>
          </Stack>
          <ContextChips />
          <Stack gap="xs" align="flex-start">
            {STARTERS.map((prompt) => (
              <Chip key={prompt.id} label={prompt.label} icon={prompt.icon} onPress={() => send(prompt.label)} />
            ))}
          </Stack>
        </Stack>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} onRetry={retry} />}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          contentContainerStyle={{ paddingVertical: spacing.sm }}
          onContentSizeChange={scrollToEnd}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}
