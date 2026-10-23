import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandStorage } from '../services/storage';
import { analytics, AnalyticsEvents } from '../services/analytics';
import {
  createTask,
  createTaskCategory,
  touchEntity,
  emptyCollection,
  upsert,
  upsertMany,
  removeById,
  denormalise,
  deriveFromCollection,
  TaskStatus,
  DEFAULT_TASK_CATEGORIES,
  dependencyError,
  pruneDependencies,
} from '../models';
import { addDays, todayISO } from '../lib/date';

/**
 * Tasks and task categories.
 *
 * Collections are normalised (`byId` + `allIds`), so completing one task in a
 * list of 200 writes one key rather than rebuilding an array, and cross-slice
 * lookups stay O(1).
 *
 * Analytics fire from the store rather than from screens. Completing a task
 * happens from the task list, the task detail sheet, Home, and eventually from
 * an AI confirmation - tracking at the mutation means one call site instead of
 * four, and no way to add a fifth that forgets.
 */

const initialState = {
  tasks: emptyCollection(),
  categories: emptyCollection(),
  /** Set when the default checklist has been seeded, so we never double-seed. */
  seededAt: null,
  /**
   * Today's checklist: the task ids picked this morning, held for the day so
   * a ticked task stays on the list (checked) instead of being replaced.
   */
  today: { date: null, taskIds: [] },
};

export const usePlanningStore = create()(
  persist(
    (set, get) => ({
      ...initialState,

      // --- Seeding ----------------------------------------------------------
      /** Create the default category set for a new wedding. Idempotent. */
      seedCategories(weddingId) {
        if (get().seededAt) return;

        const categories = DEFAULT_TASK_CATEGORIES.map((entry, index) =>
          createTaskCategory({
            weddingId,
            key: entry.key,
            name: entry.name,
            icon: entry.icon,
            order: index,
          })
        );

        set({
          categories: upsertMany(emptyCollection(), categories),
          seededAt: new Date().toISOString(),
        });
      },

      /** Bulk-insert generated tasks (from plan generation or an AI suggestion). */
      addTasks(tasks = []) {
        if (!tasks.length) return [];
        set((state) => ({ tasks: upsertMany(state.tasks, tasks) }));
        return tasks;
      },

      // --- Tasks ------------------------------------------------------------
      addTask(input) {
        const task = createTask(input);
        set((state) => ({ tasks: upsert(state.tasks, task) }));
        analytics.track(AnalyticsEvents.TASK_CREATED, {
          categoryId: task.categoryId,
          hasDueDate: Boolean(task.dueDate),
          isSystemGenerated: task.isSystemGenerated,
        });
        return task;
      },

      updateTask(id, patch) {
        const existing = get().tasks.byId[id];
        if (!existing) return null;
        const updated = touchEntity(existing, patch);
        set((state) => ({ tasks: upsert(state.tasks, updated) }));
        analytics.track(AnalyticsEvents.TASK_EDITED, { taskId: id });
        return updated;
      },

      /**
       * Toggle completion. Returns the updated task so the caller can drive the
       * celebration animation off the result rather than guessing.
       */
      toggleTask(id) {
        const existing = get().tasks.byId[id];
        if (!existing) return null;

        const nowDone = existing.status !== TaskStatus.DONE;
        const updated = touchEntity(existing, {
          status: nowDone ? TaskStatus.DONE : TaskStatus.TODO,
          completedAt: nowDone ? new Date().toISOString() : null,
          // Completing a snoozed task should clear the snooze, not leave it set.
          snoozedUntil: nowDone ? null : existing.snoozedUntil,
        });

        set((state) => ({ tasks: upsert(state.tasks, updated) }));
        analytics.track(
          nowDone ? AnalyticsEvents.TASK_COMPLETED : AnalyticsEvents.TASK_REOPENED,
          { taskId: id, categoryId: existing.categoryId }
        );
        return updated;
      },

      /** Push a task out by N days without touching its real due date. */
      snoozeTask(id, days = 7) {
        const existing = get().tasks.byId[id];
        if (!existing) return null;

        const updated = touchEntity(existing, {
          status: TaskStatus.SNOOZED,
          snoozedUntil: addDays(todayISO(), days),
        });

        set((state) => ({ tasks: upsert(state.tasks, updated) }));
        analytics.track(AnalyticsEvents.TASK_SNOOZED, { taskId: id, days });
        return updated;
      },

      unsnoozeTask(id) {
        const existing = get().tasks.byId[id];
        if (!existing) return null;
        const updated = touchEntity(existing, {
          status: TaskStatus.TODO,
          snoozedUntil: null,
        });
        set((state) => ({ tasks: upsert(state.tasks, updated) }));
        return updated;
      },

      reassignTask(id, assignee) {
        const existing = get().tasks.byId[id];
        if (!existing) return null;
        const updated = touchEntity(existing, { assignee });
        set((state) => ({ tasks: upsert(state.tasks, updated) }));
        analytics.track(AnalyticsEvents.TASK_REASSIGNED, { taskId: id, assignee });
        return updated;
      },

      deleteTask(id) {
        // Tasks that waited for this one stop waiting rather than point at nothing.
        const unlinked = pruneDependencies(denormalise(get().tasks), [id]).map(({ id: taskId, waitsFor }) =>
          touchEntity(get().tasks.byId[taskId], { waitsFor })
        );
        set((state) => ({ tasks: upsertMany(removeById(state.tasks, id), unlinked) }));
        analytics.track(AnalyticsEvents.TASK_DELETED, { taskId: id });
      },

      // --- Dependencies (slice C2) --------------------------------------------
      /**
       * Make `taskId` wait for `prerequisiteId`. Returns `{ ok: true }`, or
       * `{ ok: false, error }` when the link is refused (a loop, a repeat, too many).
       */
      addPrerequisite(taskId, prerequisiteId) {
        const error = dependencyError(taskId, prerequisiteId, denormalise(get().tasks));
        if (error) return { ok: false, error };
        const task = get().tasks.byId[taskId];
        const updated = touchEntity(task, { waitsFor: [...(task.waitsFor ?? []), prerequisiteId] });
        set((state) => ({ tasks: upsert(state.tasks, updated) }));
        analytics.track(AnalyticsEvents.TASK_DEPENDENCY_ADDED, { taskId });
        return { ok: true };
      },

      removePrerequisite(taskId, prerequisiteId) {
        const task = get().tasks.byId[taskId];
        if (!task || !(task.waitsFor ?? []).includes(prerequisiteId)) return false;
        const updated = touchEntity(task, { waitsFor: task.waitsFor.filter((id) => id !== prerequisiteId) });
        set((state) => ({ tasks: upsert(state.tasks, updated) }));
        return true;
      },

      // --- Categories -------------------------------------------------------
      addCategory(input) {
        const category = createTaskCategory(input);
        set((state) => ({ categories: upsert(state.categories, category) }));
        return category;
      },

      updateCategory(id, patch) {
        const existing = get().categories.byId[id];
        if (!existing) return null;
        const updated = touchEntity(existing, patch);
        set((state) => ({ categories: upsert(state.categories, updated) }));
        return updated;
      },

      // --- Daily checklist ----------------------------------------------------
      /** Replace today's list. `date` is a local `YYYY-MM-DD`. */
      setTodayList(date, taskIds = []) {
        set({ today: { date, taskIds } });
      },

      /** Add one more task to today's list, e.g. after finishing the rest. */
      addToToday(taskId) {
        const { today } = get();
        if (!taskId || today.taskIds.includes(taskId)) return;
        set({ today: { date: today.date ?? todayISO(), taskIds: [...today.taskIds, taskId] } });
      },

      reset() {
        set({
          ...initialState,
          tasks: emptyCollection(),
          categories: emptyCollection(),
          today: { date: null, taskIds: [] },
        });
      },
    }),
    {
      name: 'planning:store',
      storage: zustandStorage,
      version: 1,
      partialize: (state) => ({
        tasks: state.tasks,
        categories: state.categories,
        seededAt: state.seededAt,
        today: state.today,
      }),
    }
  )
);

// --- Selectors ---------------------------------------------------------------

// Sorting is done through `deriveFromCollection` rather than inline, so the
// sorted array keeps a stable identity across renders. Calling `.sort()` on the
// result of `denormalise` would also sort the shared cached array in place.
const sortedCategories = deriveFromCollection((categories) =>
  [...categories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
);

export const selectAllTasks = (state) => denormalise(state.tasks);
export const selectAllCategories = (state) => sortedCategories(state.categories);

export const selectTaskById = (id) => (state) => state.tasks.byId[id] ?? null;
export const selectCategoryById = (id) => (state) => state.categories.byId[id] ?? null;

export const selectTaskCount = (state) => state.tasks.allIds.length;
export const selectToday = (state) => state.today;
