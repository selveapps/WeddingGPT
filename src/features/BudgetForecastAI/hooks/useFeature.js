/**
 * useBudgetForecastAI hook
 */
import { useCallback, useEffect, useMemo } from 'react';
import useBudgetForecastAIStore from '../store';
import { filterBudgetForecastAIItems, sortBudgetForecastAIItems, calculateBudgetForecastAIProgress } from '../utils/helpers';

export function useBudgetForecastAI() {
  const items = useBudgetForecastAIStore((s) => s.items);
  const loading = useBudgetForecastAIStore((s) => s.loading);
  const error = useBudgetForecastAIStore((s) => s.error);
  const filters = useBudgetForecastAIStore((s) => s.filters);
  const stats = useBudgetForecastAIStore((s) => s.stats);
  const selectedId = useBudgetForecastAIStore((s) => s.selectedId);
  const fetchItems = useBudgetForecastAIStore((s) => s.fetchItems);
  const addItem = useBudgetForecastAIStore((s) => s.addItem);
  const updateItem = useBudgetForecastAIStore((s) => s.updateItem);
  const deleteItem = useBudgetForecastAIStore((s) => s.deleteItem);
  const setFilters = useBudgetForecastAIStore((s) => s.setFilters);
  const selectItem = useBudgetForecastAIStore((s) => s.selectItem);
  const clearSelection = useBudgetForecastAIStore((s) => s.clearSelection);
  const clearError = useBudgetForecastAIStore((s) => s.clearError);
  const getSelected = useBudgetForecastAIStore((s) => s.getSelected);

  useEffect(() => { fetchItems().catch(() => {}); }, []);

  const filteredItems = useMemo(() => {
    const filtered = filterBudgetForecastAIItems(items, filters);
    return sortBudgetForecastAIItems(filtered, filters.sortBy, filters.sortOrder);
  }, [items, filters]);

  const progress = useMemo(() => calculateBudgetForecastAIProgress(items), [items]);
  const selected = useMemo(() => getSelected(), [items, selectedId]);
  const refresh = useCallback(() => fetchItems(), [fetchItems]);

  return { items, filteredItems, loading, error, filters, stats, selectedId, selected, progress, fetchItems, addItem, updateItem, deleteItem, setFilters, selectItem, clearSelection, clearError, refresh };
}
export default useBudgetForecastAI;
