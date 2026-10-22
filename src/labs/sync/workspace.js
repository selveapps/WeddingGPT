import { useWeddingStore, usePlanningStore, useBudgetStore, useGuestStore } from '@/store';

/**
 * The bridge between the real stores and the pure sync model. Kept apart from
 * `model.js` so the model stays testable without any store.
 */

export function readWorkspace() {
  const planning = usePlanningStore.getState();
  const budget = useBudgetStore.getState();
  const guests = useGuestStore.getState();
  const wedding = useWeddingStore.getState();

  return {
    collections: {
      tasks: planning.tasks,
      taskCategories: planning.categories,
      expenses: budget.expenses,
      budgetCategories: budget.categories,
      guests: guests.guests,
      households: guests.households,
    },
    singletons: {
      wedding: wedding.wedding,
      budget: budget.budget,
    },
  };
}

/** Write merged slices back. Only call after the couple has confirmed the preview. */
export function writeWorkspace({ collections, singletons }) {
  usePlanningStore.setState({ tasks: collections.tasks, categories: collections.taskCategories });
  useBudgetStore.setState({
    expenses: collections.expenses,
    categories: collections.budgetCategories,
    budget: singletons.budget,
  });
  useGuestStore.setState({ guests: collections.guests, households: collections.households });
  if (singletons.wedding) useWeddingStore.setState({ wedding: singletons.wedding });
}
