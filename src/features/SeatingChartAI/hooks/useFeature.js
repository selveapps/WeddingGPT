/**
 * useSeatingChartAI hook
 */
import { useCallback, useEffect, useMemo } from 'react';
import useSeatingChartAIStore from '../store';
import { filterSeatingChartAIItems, sortSeatingChartAIItems, calculateSeatingChartAIProgress } from '../utils/helpers';

export function useSeatingChartAI() {
  const items = useSeatingChartAIStore((s) => s.items);
  const loading = useSeatingChartAIStore((s) => s.loading);
  const error = useSeatingChartAIStore((s) => s.error);
  const filters = useSeatingChartAIStore((s) => s.filters);
  const stats = useSeatingChartAIStore((s) => s.stats);
  const selectedId = useSeatingChartAIStore((s) => s.selectedId);
  const fetchItems = useSeatingChartAIStore((s) => s.fetchItems);
  const addItem = useSeatingChartAIStore((s) => s.addItem);
  const updateItem = useSeatingChartAIStore((s) => s.updateItem);
  const deleteItem = useSeatingChartAIStore((s) => s.deleteItem);
  const setFilters = useSeatingChartAIStore((s) => s.setFilters);
  const selectItem = useSeatingChartAIStore((s) => s.selectItem);
  const clearSelection = useSeatingChartAIStore((s) => s.clearSelection);
  const clearError = useSeatingChartAIStore((s) => s.clearError);
  const getSelected = useSeatingChartAIStore((s) => s.getSelected);

  useEffect(() => { fetchItems().catch(() => {}); }, []);

  const filteredItems = useMemo(() => {
    const filtered = filterSeatingChartAIItems(items, filters);
    return sortSeatingChartAIItems(filtered, filters.sortBy, filters.sortOrder);
  }, [items, filters]);

  const progress = useMemo(() => calculateSeatingChartAIProgress(items), [items]);
  const selected = useMemo(() => getSelected(), [items, selectedId]);
  const refresh = useCallback(() => fetchItems(), [fetchItems]);

  return { items, filteredItems, loading, error, filters, stats, selectedId, selected, progress, fetchItems, addItem, updateItem, deleteItem, setFilters, selectItem, clearSelection, clearError, refresh };
}
export default useSeatingChartAI;
