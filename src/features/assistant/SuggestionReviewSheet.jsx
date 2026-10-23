import React, { useEffect, useState } from 'react';
import { Share, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  BottomSheet,
  Button,
  Stack,
  Row,
  Text,
  TextField,
  Touchable,
  Icon,
  useToast,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { useAIStore } from '@/store';
import { effectivePayload, SuggestionType } from '@/models';
import { formatMediumDate } from '@/lib/date';
import { Routes } from '@/navigation/routes';

import { ExpenseReview, RsvpReview } from './ActionReview';

/**
 * Review, edit, then confirm - the confirmation step PRD s.13 requires.
 *
 * Every proposal opens here before anything happens:
 *  - A checklist shows each task as an editable title with a remove control.
 *    Only "Add to plan" creates tasks, and only the ones still in the list.
 *  - A drafted message opens as editable text. "Share" hands it to the system
 *    share sheet, so the couple sends it from their own WhatsApp, email or
 *    messages - the assistant never sends anything itself.
 *  - An expense or an RSVP change (understood on the phone) opens as an
 *    editable preview; only its confirm button records it.
 */
export function SuggestionReviewSheet({ suggestion, visible, onClose }) {
  const router = useRouter();
  const toast = useToast();
  const { spacing, colors, radii } = useTheme();
  const confirmSuggestion = useAIStore((state) => state.confirmSuggestion);
  const discardSuggestion = useAIStore((state) => state.discardSuggestion);

  const [tasks, setTasks] = useState([]);
  const [body, setBody] = useState('');
  const [action, setAction] = useState({});

  // Re-seed the editable copy each time the sheet opens, from the latest edit.
  useEffect(() => {
    if (!visible || !suggestion) return;
    const payload = effectivePayload(suggestion);
    setTasks((payload.tasks ?? []).map((task, i) => ({ ...task, key: `${i}` })));
    setBody(payload.body ?? '');
    setAction(payload);
  }, [visible, suggestion]);

  if (!suggestion) return null;
  const isTasks = suggestion.type === SuggestionType.CREATE_TASKS;
  const isExpense = suggestion.type === SuggestionType.ADD_EXPENSE;
  const isRsvp = suggestion.type === SuggestionType.UPDATE_GUEST;
  const kept = tasks.filter((task) => task.title.trim());
  const rsvpCount = (action.guestIds ?? []).length;

  const confirmAction = () => {
    const { ok, count } = confirmSuggestion(suggestion.id, action);
    if (!ok) {
      toast.error(isExpense ? 'Add a description and an amount first.' : 'There is no one left to update.');
      return;
    }
    onClose();
    if (isExpense) {
      toast.success('Expense recorded', { actionLabel: 'View', onAction: () => router.push(Routes.budget) });
    } else {
      toast.success(`${count} ${count === 1 ? 'guest' : 'guests'} updated`, {
        actionLabel: 'View',
        onAction: () => router.push(Routes.guests),
      });
    }
  };

  const addTasks = () => {
    const { ok, count } = confirmSuggestion(suggestion.id, {
      tasks: kept.map(({ key, ...task }) => ({ ...task, title: task.title.trim() })),
    });
    onClose();
    if (ok) {
      toast.success(`${count} task${count === 1 ? '' : 's'} added to your plan`, {
        actionLabel: 'View',
        onAction: () => router.push(Routes.planning),
      });
    }
  };

  const share = async () => {
    try {
      const result = await Share.share({ message: body });
      if (result.action !== Share.dismissedAction) {
        confirmSuggestion(suggestion.id, { body });
        onClose();
      }
    } catch {
      toast.error('Sharing is not available here - select the text to copy it instead.');
    }
  };

  const discard = () => {
    discardSuggestion(suggestion.id);
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={suggestion.title}
      subtitle={
        isTasks
          ? 'Rename or remove anything, then add what is left to your plan.'
          : isExpense
            ? 'Change anything, then record it. Nothing is added to your budget before that.'
            : isRsvp
              ? 'Leave anyone out or change the answer, then confirm.'
              : 'Edit anything you like. Nothing is sent until you share it.'
      }
      footer={
        <Stack gap="xs">
          {isTasks ? (
            <Button
              label={kept.length ? `Add ${kept.length} task${kept.length === 1 ? '' : 's'} to plan` : 'Nothing to add'}
              iconLeft="plus"
              onPress={addTasks}
              disabled={kept.length === 0}
            />
          ) : isExpense ? (
            <Button
              label="Record expense"
              iconLeft="check"
              onPress={confirmAction}
              disabled={!action.title?.trim() || !action.amount}
            />
          ) : isRsvp ? (
            <Button
              label={rsvpCount ? `Update ${rsvpCount} ${rsvpCount === 1 ? 'guest' : 'guests'}` : 'No one to update'}
              iconLeft="check"
              onPress={confirmAction}
              disabled={!rsvpCount}
            />
          ) : (
            <Button label="Share or copy" iconLeft="send" onPress={share} disabled={!body.trim()} />
          )}
          <Button label="Discard suggestion" variant="ghost" onPress={discard} />
        </Stack>
      }
    >
      {isExpense ? (
        <ExpenseReview value={action} onChange={setAction} />
      ) : isRsvp ? (
        <RsvpReview value={action} onChange={setAction} />
      ) : isTasks ? (
        <Stack gap="sm">
          {tasks.map((task) => (
            <Row key={task.key} gap="xs" align="flex-start">
              <TextField
                value={task.title}
                onChangeText={(title) =>
                  setTasks((current) => current.map((t) => (t.key === task.key ? { ...t, title } : t)))
                }
                helper={task.dueDate ? `Due ${formatMediumDate(task.dueDate)}` : 'No due date'}
                containerStyle={{ flex: 1 }}
                accessibilityLabel="Task title"
              />
              <Touchable
                onPress={() => setTasks((current) => current.filter((t) => t.key !== task.key))}
                haptic="light"
                accessibilityLabel={`Remove ${task.title}`}
                style={{
                  width: 44,
                  height: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: radii.md,
                  backgroundColor: colors.surfaceSunken,
                }}
              >
                <Icon name="close" size="md" color="inkMuted" />
              </Touchable>
            </Row>
          ))}
          {tasks.length === 0 ? (
            <Text variant="body" color="muted">
              You removed every task. Discard the suggestion, or close this and ask for a different list.
            </Text>
          ) : null}
        </Stack>
      ) : (
        <View style={{ paddingBottom: spacing.xs }}>
          <TextField value={body} onChangeText={setBody} multiline numberOfLines={12} accessibilityLabel="Message" />
        </View>
      )}
    </BottomSheet>
  );
}

export default SuggestionReviewSheet;
