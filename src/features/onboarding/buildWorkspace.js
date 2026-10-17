import { useWeddingStore, usePlanningStore, useBudgetStore } from '@/store';
import { analytics, AnalyticsEvents } from '@/services/analytics';
import { generatePersonalisedPlan, DEFAULT_TASK_CATEGORIES } from '@/models';

/**
 * Make sure there is a workspace to land on, then return its plan.
 *
 * This is the one path from "whatever the couple has told us" to a working
 * dashboard - the end of onboarding, a skip from any step, and a deep link into
 * Home before onboarding ever ran all come through here. An empty draft is a
 * valid input: it produces an undated wedding with a checklist paced by stage.
 *
 * Idempotent. The wedding is only created once, categories only seed once, and
 * tasks and budget are only written while `planGeneratedAt` is unset - so a
 * double render, a fast back-and-forward, or Home and the plan screen both
 * calling this cannot seed a second checklist on top of the first. On re-entry
 * the plan is regenerated for display only.
 */
export function buildWorkspace() {
  if (!useWeddingStore.getState().wedding) {
    useWeddingStore.getState().completeOnboarding();
  }

  const { wedding, planGeneratedAt, markPlanGenerated } = useWeddingStore.getState();

  // Categories must exist before tasks, so each task can carry a real category
  // id rather than being filed as loose.
  usePlanningStore.getState().seedCategories(wedding.id);

  const seeded = usePlanningStore.getState();
  const categories = DEFAULT_TASK_CATEGORIES.map((entry) =>
    Object.values(seeded.categories.byId).find((category) => category.key === entry.key)
  ).filter(Boolean);

  const plan = generatePersonalisedPlan({ wedding, categories });

  if (!planGeneratedAt) {
    seeded.addTasks(plan.tasks);

    if (wedding.budgetTotal) {
      useBudgetStore.getState().initialiseBudget({
        weddingId: wedding.id,
        total: wedding.budgetTotal,
        currency: wedding.currency,
      });
    }

    markPlanGenerated();
    analytics.track(AnalyticsEvents.PLAN_GENERATED, {
      taskCount: plan.tasks.length,
      horizonMonths: plan.horizonMonths,
      hasBudget: Boolean(wedding.budgetTotal),
    });
  }

  return { wedding: useWeddingStore.getState().wedding, plan };
}

export default buildWorkspace;
