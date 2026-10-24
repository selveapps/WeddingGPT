/**
 * Budget AI Insights – forecasts, what-if scenarios, category health.
 */
import { createEntity } from './base';

export function createBudgetScenario(partial = {}) {
  return createEntity({
    weddingId: null, title: 'What-if scenario', description: '',
    adjustments: [], // { categoryId, deltaAmount, note }
    projectedTotal: 0, currency: 'USD', isActive: false, ...partial,
  });
}

export function createBudgetInsight(partial = {}) {
  return createEntity({
    weddingId: null, type: 'overspend_risk', // overspend_risk | savings | tip | anomaly
    severity: 'info', // info | warning | critical
    title: '', body: '', categoryId: null, amount: 0,
    dismissed: false, createdAt: null, ...partial,
  });
}

export function createSpendingForecast(partial = {}) {
  return createEntity({
    weddingId: null, asOf: null, projectedSpend: 0, projectedRemaining: 0,
    confidence: 0.7, notes: '', breakdown: [], ...partial,
  });
}

export function analyzeCategoryHealth(allocated, spent, committed) {
  const total = (spent || 0) + (committed || 0);
  const ratio = allocated > 0 ? total / allocated : 0;
  let status = 'healthy';
  if (ratio >= 1.05) status = 'over';
  else if (ratio >= 0.9) status = 'tight';
  else if (ratio < 0.4 && allocated > 0) status = 'underutilized';
  return { ratio, status, remaining: (allocated || 0) - total };
}

export function generateSimpleInsights(categories) {
  const insights = [];
  for (const cat of categories || []) {
    const health = analyzeCategoryHealth(cat.allocated, cat.spent, cat.committed);
    if (health.status === 'over') {
      insights.push(createBudgetInsight({
        type: 'overspend_risk', severity: 'critical',
        title: `${cat.name || 'Category'} is over allocated`,
        body: `Committed + spent exceeds allocation by ${Math.round((health.ratio - 1) * 100)}%.`,
        categoryId: cat.id, amount: Math.abs(health.remaining),
      }));
    } else if (health.status === 'tight') {
      insights.push(createBudgetInsight({
        type: 'overspend_risk', severity: 'warning',
        title: `${cat.name || 'Category'} is nearly full`,
        body: 'Less than 10% headroom remains.',
        categoryId: cat.id,
      }));
    }
  }
  return insights;
}
