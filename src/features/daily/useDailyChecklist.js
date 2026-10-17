import { useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { usePlanningStore, selectAllTasks, selectToday } from '@/store';
import { pickDailyTasks, isTaskOpen } from '@/models';
import { todayISO } from '@/lib/date';

/** Today's date, refreshed when the app comes back to the foreground. */
function useToday() {
  const [today, setToday] = useState(todayISO);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setToday(todayISO());
    });
    return () => subscription.remove();
  }, []);
  return today;
}

/**
 * Today's checklist for the Home screen.
 *
 * The list is picked the first time the app is opened each day and stored, so
 * it stays put while the couple works through it. It is re-picked when the day
 * changes, or when it is empty but the plan now has open tasks (for example,
 * straight after onboarding builds the plan).
 *
 * Returns `{ tasks, done, total, allDone, hasMore, addOneMore }`.
 */
export function useDailyChecklist() {
  const today = useToday();
  const tasks = usePlanningStore(selectAllTasks);
  const stored = usePlanningStore(selectToday);
  const setTodayList = usePlanningStore((state) => state.setTodayList);
  const addToToday = usePlanningStore((state) => state.addToToday);

  const byId = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);
  const hasOpenTasks = useMemo(() => tasks.some(isTaskOpen), [tasks]);

  const stale = stored.date !== today;
  const empty = stored.taskIds.filter((id) => byId.has(id)).length === 0;

  useEffect(() => {
    if (stale || (empty && hasOpenTasks)) {
      setTodayList(today, pickDailyTasks(tasks).map((task) => task.id));
    }
    // `tasks` is read at the moment of picking; re-picking on every task edit
    // would defeat holding the list for the day.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stale, empty, hasOpenTasks, today, setTodayList]);

  const list = stale ? [] : stored.taskIds.map((id) => byId.get(id)).filter(Boolean);
  const done = list.filter((task) => !isTaskOpen(task)).length;
  const next = pickDailyTasks(tasks, { size: 1, exclude: stored.taskIds })[0] ?? null;

  return {
    tasks: list,
    done,
    total: list.length,
    allDone: list.length > 0 && done === list.length,
    hasMore: Boolean(next),
    addOneMore: () => next && addToToday(next.id),
  };
}

export default useDailyChecklist;
