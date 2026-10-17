import { useCallback, useMemo } from 'react';

import {
  useWeddingStore,
  usePlanningStore,
  useBudgetStore,
  useNotificationStore,
  selectWedding,
  selectAllTasks,
  selectAllExpenses,
  selectReadIds,
  selectToday,
} from '@/store';
import { buildInbox } from './inbox';

/** The in-app feed, with read state. See `buildInbox`. */
export function useInbox() {
  const wedding = useWeddingStore(selectWedding);
  const tasks = usePlanningStore(selectAllTasks);
  const expenses = useBudgetStore(selectAllExpenses);
  const readIds = useNotificationStore(selectReadIds);
  const markRead = useNotificationStore((state) => state.markRead);
  const today = usePlanningStore(selectToday);

  const items = useMemo(() => {
    const read = new Set(readIds);
    return buildInbox({ wedding, tasks, expenses, today }).map((item) => ({
      ...item,
      unread: !read.has(item.id),
    }));
  }, [wedding, tasks, expenses, today, readIds]);

  const unreadCount = items.filter((item) => item.unread).length;
  const markAllRead = useCallback(() => markRead(items.map((item) => item.id)), [markRead, items]);

  return { items, unreadCount, markAllRead, markRead };
}

export default useInbox;
