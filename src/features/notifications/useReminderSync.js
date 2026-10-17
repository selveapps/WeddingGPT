import { useEffect } from 'react';
import { useRouter } from 'expo-router';

import {
  useWeddingStore,
  usePlanningStore,
  useBudgetStore,
  useNotificationStore,
  selectWedding,
  selectAllTasks,
  selectAllExpenses,
  selectNotificationPreferences,
  selectToday,
} from '@/store';
import { todayISO } from '@/lib/date';
import { syncReminders, onReminderOpened } from '@/services/notifications';

/** Long enough that ticking off five tasks in a row reschedules once. */
const SYNC_DELAY_MS = 1200;

/**
 * Keep scheduled reminders in step with the workspace, and open the right
 * screen when one is tapped. Mounted once, in the tab shell.
 */
export function useReminderSync() {
  const router = useRouter();

  const wedding = useWeddingStore(selectWedding);
  const tasks = usePlanningStore(selectAllTasks);
  const expenses = useBudgetStore(selectAllExpenses);
  const preferences = useNotificationStore(selectNotificationPreferences);
  const today = usePlanningStore(selectToday);

  useEffect(() => {
    const timer = setTimeout(() => {
      const todayTasks =
        today.date === todayISO()
          ? today.taskIds.map((id) => tasks.find((task) => task.id === id)).filter(Boolean)
          : null;
      syncReminders({ wedding, tasks, expenses, preferences, todayTasks });
    }, SYNC_DELAY_MS);
    return () => clearTimeout(timer);
  }, [wedding, tasks, expenses, preferences, today]);

  useEffect(() => onReminderOpened((url) => router.push(url)), [router]);
}

export default useReminderSync;
