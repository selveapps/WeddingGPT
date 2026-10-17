import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandStorage } from '../services/storage';
import { analytics, AnalyticsEvents } from '../services/analytics';
import {
  createBudget,
  createBudgetCategory,
  createExpense,
  buildDefaultCategories,
  touchEntity,
  emptyCollection,
  upsert,
  upsertMany,
  removeById,
  denormalise,
  deriveFromCollection,
  PaymentStatus,
} from '../models';

/**
 * Budget, categories and expenses.
 *
 * The store holds only what is authored: the total, the category allocations
 * and the expense records. Spent, committed and remaining are derived on read
 * by `summariseBudget` - deriving keeps a single source of truth, and the
 * arithmetic is trivial next to the cost of two numbers disagreeing.
 */

const initialState = {
  budget: null,
  categories: emptyCollection(),
  expenses: emptyCollection(),
};

export const useBudgetStore = create()(
  persist(
    (set, get) => ({
      ...initialState,

      // --- Setup ------------------------------------------------------------
      /**
       * Create the budget and seed a default category structure from the total.
       * Idempotent: re-running with an existing budget only updates the total.
       */
      initialiseBudget({ weddingId, total = 0, currency }) {
        const existing = get().budget;
        if (existing) {
          set({ budget: touchEntity(existing, { total, currency: currency ?? existing.currency }) });
          return existing;
        }

        const budget = createBudget({ weddingId, total, currency });
        const categories = buildDefaultCategories(budget.id, weddingId, total);

        set({
          budget,
          categories: upsertMany(emptyCollection(), categories),
        });

        analytics.track(AnalyticsEvents.BUDGET_CREATED, { total, categoryCount: categories.length });
        return budget;
      },

      /**
       * Change the overall total, rescaling every category allocation by the
       * same ratio. Editing the total otherwise leaves allocations summing to
       * the old figure, which silently makes every category look wrong.
       */
      setTotal(total) {
        const { budget, categories } = get();
        if (!budget) return;

        const previous = budget.total || 0;
        const ratio = previous > 0 ? total / previous : 0;

        const rescaled =
          ratio > 0
            ? denormalise(categories).map((category) =>
                touchEntity(category, { allocated: Math.round(category.allocated * ratio) })
              )
            : [];

        set((state) => ({
          budget: touchEntity(budget, { total }),
          categories: rescaled.length ? upsertMany(state.categories, rescaled) : state.categories,
        }));

        analytics.track(AnalyticsEvents.BUDGET_UPDATED, { total });
      },

      /**
       * Change the display currency. Amounts are relabelled, not converted -
       * this is for fixing the currency, not for planning across two.
       */
      setCurrency(currency) {
        const { budget } = get();
        if (!budget || budget.currency === currency) return;
        set({ budget: touchEntity(budget, { currency }) });
      },

      // --- Categories -------------------------------------------------------
      addCategory(input) {
        const { budget } = get();
        const category = createBudgetCategory({ ...input, budgetId: budget?.id });
        set((state) => ({ categories: upsert(state.categories, category) }));
        analytics.track(AnalyticsEvents.BUDGET_CATEGORY_ADDED, { name: category.name });
        return category;
      },

      updateCategory(id, patch) {
        const existing = get().categories.byId[id];
        if (!existing) return null;
        const updated = touchEntity(existing, patch);
        set((state) => ({ categories: upsert(state.categories, updated) }));
        return updated;
      },

      deleteCategory(id) {
        // Orphaning expenses would hide them from every view. Move them to
        // uncategorised instead, so nothing the couple recorded disappears.
        const orphans = denormalise(get().expenses)
          .filter((expense) => expense.budgetCategoryId === id)
          .map((expense) => touchEntity(expense, { budgetCategoryId: null }));

        set((state) => ({
          categories: removeById(state.categories, id),
          expenses: orphans.length ? upsertMany(state.expenses, orphans) : state.expenses,
        }));
      },

      // --- Expenses ---------------------------------------------------------
      addExpense(input) {
        const expense = createExpense(input);
        set((state) => ({ expenses: upsert(state.expenses, expense) }));
        analytics.track(AnalyticsEvents.EXPENSE_ADDED, {
          categoryId: expense.budgetCategoryId,
          commitment: expense.commitment,
        });
        return expense;
      },

      updateExpense(id, patch) {
        const existing = get().expenses.byId[id];
        if (!existing) return null;
        const updated = touchEntity(existing, patch);
        set((state) => ({ expenses: upsert(state.expenses, updated) }));
        analytics.track(AnalyticsEvents.EXPENSE_UPDATED, { expenseId: id });
        return updated;
      },

      /** Record a payment, keeping `paymentStatus` consistent with the amounts. */
      recordPayment(id, paidAmount) {
        const existing = get().expenses.byId[id];
        if (!existing) return null;

        const clamped = Math.max(0, Math.min(paidAmount, existing.amount));
        const status =
          clamped >= existing.amount
            ? PaymentStatus.PAID
            : clamped > 0
              ? PaymentStatus.PARTIALLY_PAID
              : PaymentStatus.UNPAID;

        const updated = touchEntity(existing, { paidAmount: clamped, paymentStatus: status });
        set((state) => ({ expenses: upsert(state.expenses, updated) }));
        return updated;
      },

      deleteExpense(id) {
        set((state) => ({ expenses: removeById(state.expenses, id) }));
        analytics.track(AnalyticsEvents.EXPENSE_DELETED, { expenseId: id });
      },

      reset() {
        set({ ...initialState, categories: emptyCollection(), expenses: emptyCollection() });
      },
    }),
    {
      name: 'budget:store',
      storage: zustandStorage,
      version: 1,
      partialize: (state) => ({
        budget: state.budget,
        categories: state.categories,
        expenses: state.expenses,
      }),
    }
  )
);

// --- Selectors ---------------------------------------------------------------

export const selectBudget = (state) => state.budget;
export const selectBudgetTotal = (state) => state.budget?.total ?? 0;

// Derived arrays go through `deriveFromCollection` so they keep a stable
// identity across renders - see the note on `denormalise` in models/base.
const sortedCategories = deriveFromCollection((categories) =>
  [...categories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
);

export const selectAllExpenses = (state) => denormalise(state.expenses);
export const selectAllBudgetCategories = (state) => sortedCategories(state.categories);

/**
 * One memoised selector per category, so repeated calls with the same ID hand
 * back the same selector - and therefore the same filtered array - rather than
 * a fresh one on every render.
 */
const expensesByCategory = new Map();

export const selectExpensesForCategory = (categoryId) => {
  let selector = expensesByCategory.get(categoryId);
  if (!selector) {
    const derive = deriveFromCollection((expenses) =>
      expenses.filter((expense) => expense.budgetCategoryId === categoryId)
    );
    selector = (state) => derive(state.expenses);
    expensesByCategory.set(categoryId, selector);
  }
  return selector;
};

export const selectHasBudget = (state) => Boolean(state.budget);
