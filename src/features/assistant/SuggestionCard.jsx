import React, { useState } from 'react';

import { Card, Stack, Row, Text, Icon, Button } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { useAIStore, selectSuggestionById } from '@/store';
import { effectivePayload, SuggestionStatus, SuggestionType } from '@/models';
import { SuggestionReviewSheet } from './SuggestionReviewSheet';

/**
 * The proposal attached to a reply: "5 tasks ready to add", "A draft RSVP
 * reminder". It opens the review sheet; it never applies anything itself.
 * Once handled it settles into a quiet record of what was decided.
 *
 * @param {object} props
 * @param {string} props.suggestionId ID used to look up the proposal in the AI store.
 */
export function SuggestionCard({ suggestionId }) {
  const { colors } = useTheme();
  const suggestion = useAIStore(selectSuggestionById(suggestionId));
  const [open, setOpen] = useState(false);

  if (!suggestion) return null;
  const isTasks = suggestion.type === SuggestionType.CREATE_TASKS;
  const payload = effectivePayload(suggestion);

  if (suggestion.status === SuggestionStatus.CONFIRMED) {
    return (
      <Row gap="xs">
        {/* Confirmed suggestion */}
        <Icon name="check" size="sm" color="success" />
        {/* Confirmed suggestion text */}
        <Text variant="bodySm" color="success">
          {isTasks ? `Added ${payload.tasks?.length ?? 0} tasks to your plan` : 'Message shared'}
        </Text>
      </Row>
    );
  }

  if (suggestion.status === SuggestionStatus.DISCARDED) {
    return (
      <Text variant="bodySm" color="subtle">
        Suggestion discarded
      </Text>
    );
  }

  return (
    <>
      <Card tone="accent" padding="sm" radius="md">
        {/* Suggestion card */}
        <Stack gap="sm">
          <Row gap="xs" align="flex-start">
            <Icon name={isTasks ? 'checklist' : 'mail'} size="md" color={colors.accentSoftInk} />
            <Stack gap="hair" style={{ flex: 1 }}>
              <Text variant="labelStrong">{suggestion.title}</Text>
              <Text variant="caption" color="muted">
                {isTasks
                  ? `${payload.tasks?.length ?? 0} tasks - nothing is added until you confirm`
                  : 'Review and edit before sending'}
              </Text>
            </Stack>
          </Row>
          <Button
            label={isTasks ? 'Review and add' : 'Review draft'}
            variant="secondary"
            size="md"
            onPress={() => setOpen(true)}
          />
        </Stack>
      </Card>
      <SuggestionReviewSheet suggestion={suggestion} visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

export default SuggestionCard;
