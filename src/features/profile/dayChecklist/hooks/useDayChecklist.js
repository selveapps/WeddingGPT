import { useCallback, useMemo } from 'react';

import { createId } from '@/lib/id';
import { useWeddingStore, selectWedding } from '@/store/weddingStore';

import { STARTER_DAY_CHECKLIST } from '../lib/dayChecklistConstants';
import { sortDayChecklistTasks } from '../lib/dayChecklistHelpers';

export function useDayChecklist() {
  const wedding = useWeddingStore(selectWedding);
  const updateWedding = useWeddingStore((state) => state.updateWedding);
  const tasks = useMemo(
    () => sortDayChecklistTasks(Array.isArray(wedding?.dayOfChecklist) ? wedding.dayOfChecklist : []),
    [wedding]
  );

  const addTask = useCallback(
    (values) => {
      if (!wedding) return null;
      const now = new Date().toISOString();
      const task = {
        id: createId('day-task'),
        title: values.title.trim(),
        category: values.category,
        time: values.time?.trim() ?? '',
        owner: values.owner?.trim() ?? '',
        priority: values.priority,
        note: values.note?.trim() ?? '',
        completed: false,
        createdAt: now,
        updatedAt: now,
      };
      updateWedding({ dayOfChecklist: sortDayChecklistTasks([...tasks, task]) });
      return task;
    },
    [tasks, updateWedding, wedding]
  );

  const updateTask = useCallback(
    (id, values) => {
      if (!wedding) return null;
      const existing = tasks.find((task) => task.id === id);
      if (!existing) return null;
      const updated = {
        ...existing,
        title: values.title.trim(),
        category: values.category,
        time: values.time?.trim() ?? '',
        owner: values.owner?.trim() ?? '',
        priority: values.priority,
        note: values.note?.trim() ?? '',
        updatedAt: new Date().toISOString(),
      };
      updateWedding({
        dayOfChecklist: sortDayChecklistTasks(tasks.map((task) => (task.id === id ? updated : task))),
      });
      return updated;
    },
    [tasks, updateWedding, wedding]
  );

  const toggleTask = useCallback(
    (id) => {
      if (!wedding) return;
      updateWedding({
        dayOfChecklist: sortDayChecklistTasks(
          tasks.map((task) =>
            task.id === id
              ? { ...task, completed: !task.completed, updatedAt: new Date().toISOString() }
              : task
          )
        ),
      });
    },
    [tasks, updateWedding, wedding]
  );

  const removeTask = useCallback(
    (id) => {
      if (!wedding || !tasks.some((task) => task.id === id)) return false;
      updateWedding({ dayOfChecklist: tasks.filter((task) => task.id !== id) });
      return true;
    },
    [tasks, updateWedding, wedding]
  );

  const addStarterChecklist = useCallback(() => {
    if (!wedding || tasks.length) return false;
    const createdAt = new Date().toISOString();
    const starterTasks = STARTER_DAY_CHECKLIST.map((task) => ({
      ...task,
      id: createId('day-task'),
      owner: '',
      note: '',
      completed: false,
      createdAt,
      updatedAt: createdAt,
    }));
    updateWedding({ dayOfChecklist: sortDayChecklistTasks(starterTasks) });
    return true;
  }, [tasks.length, updateWedding, wedding]);

  const clearCompleted = useCallback(() => {
    if (!wedding) return false;
    const remainingTasks = tasks.filter((task) => !task.completed);
    if (remainingTasks.length === tasks.length) return false;
    updateWedding({ dayOfChecklist: remainingTasks });
    return true;
  }, [tasks, updateWedding, wedding]);

  return {
    tasks,
    addTask,
    updateTask,
    toggleTask,
    removeTask,
    addStarterChecklist,
    clearCompleted,
  };
}

export default useDayChecklist;
