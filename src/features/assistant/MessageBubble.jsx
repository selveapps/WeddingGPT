import React, { memo } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Text, Row, Stack, Icon, Button } from '@/design-system/components';
import { useTheme, useMotion } from '@/design-system/theme';
import { useAIStore, selectStreamingText } from '@/store';
import { MessageRole, MessageStatus } from '@/models';
import { MessageText } from './MessageText';
import { TypingIndicator } from './TypingIndicator';
import { Mascot } from '@/features/mascot/Mascot';
import { SuggestionCard } from './SuggestionCard';

/**
 * One turn of the conversation.
 *
 * The couple's messages sit right in the brand colour; the assistant's sit
 * left on paper, beside the swan mascot - thinking while a reply is on its way. An assistant bubble moves through the
 * states in PRD s.12: loading (typing dots), streaming (text growing),
 * complete (with any proposal card), and error (message plus Retry).
 */
function MessageBubbleInner({ message, onRetry }) {
  const { colors, spacing, radii } = useTheme();
  const motion = useMotion();
  const streaming = useAIStore(selectStreamingText(message.id));

  const isUser = message.role === MessageRole.USER;
  const entering = FadeIn.duration(motion.durations.base);

  if (isUser) {
    return (
      <Animated.View entering={entering} style={{ alignItems: 'flex-end' }}>
        <View
          style={{
            maxWidth: '84%',
            backgroundColor: colors.brand,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: radii.lg,
            borderBottomRightRadius: radii.xs,
          }}
        >
          <Text variant="body" color="onBrand" selectable>
            {message.content}
          </Text>
        </View>
      </Animated.View>
    );
  }

  const status = message.status;
  const text = status === MessageStatus.STREAMING ? streaming ?? '' : message.content;

  return (
    <Animated.View entering={entering}>
      <Row gap="xs" align="flex-start">
        <Mascot
          size={34}
          still
          mood={status === MessageStatus.PENDING || status === MessageStatus.STREAMING ? 'think' : 'happy'}
        />

        <View
          style={{
            flex: 1,
            maxWidth: '88%',
            backgroundColor: colors.surface,
            borderColor: status === MessageStatus.FAILED ? colors.danger : colors.border,
            borderWidth: 1,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: radii.lg,
            borderTopLeftRadius: radii.xs,
          }}
        >
          {status === MessageStatus.PENDING ? (
            <TypingIndicator />
          ) : status === MessageStatus.FAILED ? (
            <Stack gap="sm">
              <Row gap="xs" align="flex-start">
                <Icon name="alert" size="md" color="danger" />
                <Text variant="body" color="muted" style={{ flex: 1 }} accessibilityRole="alert">
                  {message.error?.message ?? 'That did not go through.'}
                </Text>
              </Row>
              {message.error?.retryable !== false ? (
                <Button
                  label="Retry"
                  iconLeft="refresh"
                  variant="secondary"
                  size="sm"
                  fullWidth={false}
                  onPress={() => onRetry(message.id)}
                />
              ) : null}
            </Stack>
          ) : (
            <Stack gap="sm">
              <MessageText text={text} />
              {status === MessageStatus.COMPLETE &&
                (message.suggestionIds ?? []).map((id) => <SuggestionCard key={id} suggestionId={id} />)}
              {status === MessageStatus.COMPLETE && message.metadata?.fellBack ? (
                <Text variant="caption" color="subtle">
                  Answered by the on-device assistant while the connection was down.
                </Text>
              ) : null}
            </Stack>
          )}
        </View>
      </Row>
    </Animated.View>
  );
}

export const MessageBubble = memo(MessageBubbleInner);
export default MessageBubble;
