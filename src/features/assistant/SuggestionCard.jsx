import React, { useState } from 'react';

import { Card, Stack, Row, Text, Icon, Button } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { useAIStore, selectSuggestionById } from '@/store';
import { effectivePayload, SuggestionStatus, SuggestionType } from '@/models';
import { formatMoney } from '@/lib/currency';
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
  const payload = effectivePayload(suggestion);
  const copy = cardCopy(suggestion.type, payload);

  if (suggestion.status === SuggestionStatus.CONFIRMED) {
    return (
      <Row gap="xs">
        {/* Confirmed suggestion */}
        <Icon name="check" size="sm" color="success" />
        {/* Confirmed suggestion text */}
        <Text variant="bodySm" color="success">
          {copy.done}
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
            <Icon name={copy.icon} size="md" color={colors.accentSoftInk} />
            <Stack gap="hair" style={{ flex: 1 }}>
              <Text variant="labelStrong">{suggestion.title}</Text>
              <Text variant="caption" color="muted">
                {copy.hint}
              </Text>
            </Stack>
          </Row>
          <Button
            label={copy.action}
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

/** What the card says for each kind of proposal, before and after it is handled. */
function cardCopy(type, payload) {
  const tasks = payload.tasks?.length ?? 0;
  const guests = payload.guestIds?.length ?? 0;
  switch (type) {
    case SuggestionType.CREATE_TASKS:
      return {
        icon: 'checklist',
        hint: `${tasks} ${tasks === 1 ? 'task' : 'tasks'} - nothing is added until you confirm`,
        action: 'Review and add',
        done: `Added ${tasks} ${tasks === 1 ? 'task' : 'tasks'} to your plan`,
      };
    case SuggestionType.ADD_EXPENSE:
      return {
        icon: 'budget',
        hint: 'Check the amount and category - nothing is recorded until you confirm',
        action: 'Review expense',
        done: `Recorded ${formatMoney(payload.amount ?? 0)} in your budget`,
      };
    case SuggestionType.UPDATE_GUEST:
      return {
        icon: 'guests',
        hint: 'Check who and what - nothing changes until you confirm',
        action: 'Review RSVP',
        done: `Updated ${guests} ${guests === 1 ? 'guest' : 'guests'}`,
      };
    default:
      return { icon: 'mail', hint: 'Review and edit before sending', action: 'Review draft', done: 'Message shared' };
  }
}

export default SuggestionCard;
