import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  Stack,
  Row,
  Text,
  Card,
  Icon,
  Button,
  Checkbox,
  Touchable,
  ProgressBar,
  useToast,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { Routes } from '@/navigation/routes';
import { usePlanningStore } from '@/store';
import { isTaskOpen } from '@/models';
import { formatRelativeDay, formatShortDate, todayISO } from '@/lib/date';
import { analytics, AnalyticsEvents } from '@/services/analytics';
import haptics from '@/lib/haptics';
import { useDailyChecklist } from './useDailyChecklist';

/**
 * Today's checklist on Home: a few plan tasks to do today, ticked off in place.
 *
 * The same list is what the morning notification names, so tapping the
 * notification lands the couple right here.
 */
export function DailyChecklistCard() {
  const router = useRouter();
  const toast = useToast();
  const { spacing } = useTheme();
  const toggleTask = usePlanningStore((state) => state.toggleTask);
  const { tasks, done, total, allDone, hasMore, addOneMore } = useDailyChecklist();

  // Celebrate the moment the last item is ticked, not on every render after.
  const wasAllDone = useRef(allDone);
  useEffect(() => {
    if (allDone && !wasAllDone.current) {
      haptics.success();
      toast.success("That's today done. Lovely work.");
      analytics.track(AnalyticsEvents.DAILY_CHECKLIST_COMPLETED, { count: total });
    }
    wasAllDone.current = allDone;
  }, [allDone, total, toast]);

  if (total === 0) {
    return (
      <Card>
        <Row gap="md">
          <Icon name="check" size="lg" color="success" />
          <Stack gap="hair" style={{ flex: 1 }}>
            <Text variant="bodyStrong">Nothing on today's list</Text>
            <Text variant="bodySm" color="muted">
              You are all caught up. Enjoy the breather.
            </Text>
          </Stack>
        </Row>
      </Card>
    );
  }

  return (
    <Card padding="none">
      <View style={{ padding: spacing.lg, gap: spacing.sm }}>
        <Row justify="space-between" align="flex-end">
          <Stack gap="hair" style={{ flex: 1 }}>
            <Text variant="eyebrow" color="subtle">
              {formatShortDate(todayISO())}
            </Text>
            <Text variant="h3">Today's checklist</Text>
          </Stack>
          <Text variant="labelStrong" color={allDone ? 'success' : 'muted'}>
            {done} of {total} done
          </Text>
        </Row>
        <ProgressBar value={total ? done / total : 0} height={6} tone="success" />
      </View>

      {tasks.map((task) => (
        <DailyTaskRow
          key={task.id}
          task={task}
          onToggle={() => toggleTask(task.id)}
          onPress={() => router.push(Routes.taskDetail(task.id))}
        />
      ))}

      {allDone ? (
        <View style={{ padding: spacing.lg, gap: spacing.sm }}>
          <Text variant="bodySm" color="muted">
            {hasMore ? 'Feeling good? Pull in one more.' : 'Your whole plan is up to date.'}
          </Text>
          {hasMore ? (
            <Button label="Add one more task" size="md" variant="soft" iconLeft="plus" onPress={addOneMore} />
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

function DailyTaskRow({ task, onToggle, onPress }) {
  const { spacing } = useTheme();
  const finished = !isTaskOpen(task);
  const due = task.dueDate ? formatRelativeDay(task.dueDate) : null;
  const overdue = due?.endsWith('overdue');

  return (
    <Row gap="md" style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + spacing.hair }}>
      <Checkbox
        checked={finished}
        onChange={onToggle}
        label={finished ? `Mark ${task.title} as not done` : `Mark ${task.title} as done`}
      />
      <Touchable
        onPress={onPress}
        scaleOnPress={false}
        haptic="light"
        accessibilityLabel={task.title}
        accessibilityHint="Opens this task"
        style={{ flex: 1 }}
      >
        <Row gap="xs">
          <Stack gap="hair" style={{ flex: 1 }}>
            <Text
              variant="body"
              color={finished ? 'subtle' : 'default'}
              numberOfLines={2}
              style={finished ? { textDecorationLine: 'line-through' } : null}
            >
              {task.title}
            </Text>
            {due && !finished ? (
              <Text variant="caption" color={overdue ? 'danger' : 'muted'}>
                {overdue ? due : `Due ${due.toLowerCase()}`}
              </Text>
            ) : null}
          </Stack>
          <Icon name="chevronRight" size="sm" color="inkSubtle" />
        </Row>
      </Touchable>
    </Row>
  );
}

export default DailyChecklistCard;
