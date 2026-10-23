import {
  useBudgetStore,
  usePlanningStore,
  useEventStore,
  useRunOfShowStore,
  useSeatingStore,
  selectSeatingTables,
  selectAllExpenses,
  selectAllTasks,
  selectRunOfShow,
} from '@/store';
import { itemsForDay, tablesForEvent } from '@/models';

/** What deleting an event would touch, for the confirmation message. */
export function eventLinks(eventId) {
  const tasks = selectAllTasks(usePlanningStore.getState()).filter((task) => task.eventId === eventId);
  const expenses = selectAllExpenses(useBudgetStore.getState()).filter(
    (expense) => expense.eventId === eventId
  );
  const runOfShow = itemsForDay(selectRunOfShow(useRunOfShowStore.getState()), eventId);
  const tables = tablesForEvent(selectSeatingTables(useSeatingStore.getState()), eventId);
  return { tasks: tasks.length, expenses: expenses.length, runOfShow: runOfShow.length, tables: tables.length };
}

/**
 * Delete an event. Its tasks and costs are not deleted: they go back to "the
 * wedding as a whole", because a deposit paid for the mehndi is still money
 * spent even if the mehndi moves into another event. Its run of show and its
 * seating tables are deleted with it: they mean nothing on another day.
 */
export function deleteEvent(eventId) {
  const { updateTask } = usePlanningStore.getState();
  const { updateExpense } = useBudgetStore.getState();
  for (const task of selectAllTasks(usePlanningStore.getState())) {
    if (task.eventId === eventId) updateTask(task.id, { eventId: null });
  }
  for (const expense of selectAllExpenses(useBudgetStore.getState())) {
    if (expense.eventId === eventId) updateExpense(expense.id, { eventId: null });
  }
  useRunOfShowStore.getState().clearDay(eventId);
  useSeatingStore.getState().clearEvent(eventId);
  useEventStore.getState().removeEvent(eventId);
}
