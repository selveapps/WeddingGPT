/**
 * useTimelineOptimizer hook
 */
import { useCallback, useEffect, useMemo } from 'react';
import useTimelineOptimizerStore from '../store';
import { filterTimelineOptimizerItems, sortTimelineOptimizerItems, calculateTimelineOptimizerProgress } from '../utils/helpers';

export function useTimelineOptimizer() {
  const items = useTimelineOptimizerStore((s) => s.items);
  const loading = useTimelineOptimizerStore((s) => s.loading);
  const error = useTimelineOptimizerStore((s) => s.error);
  const filters = useTimelineOptimizerStore((s) => s.filters);
  const stats = useTimelineOptimizerStore((s) => s.stats);
  const selectedId = useTimelineOptimizerStore((s) => s.selectedId);
  const fetchItems = useTimelineOptimizerStore((s) => s.fetchItems);
  const addItem = useTimelineOptimizerStore((s) => s.addItem);
  const updateItem = useTimelineOptimizerStore((s) => s.updateItem);
  const deleteItem = useTimelineOptimizerStore((s) => s.deleteItem);
  const setFilters = useTimelineOptimizerStore((s) => s.setFilters);
  const selectItem = useTimelineOptimizerStore((s) => s.selectItem);
  const clearSelection = useTimelineOptimizerStore((s) => s.clearSelection);
  const clearError = useTimelineOptimizerStore((s) => s.clearError);
  const getSelected = useTimelineOptimizerStore((s) => s.getSelected);

  useEffect(() => { fetchItems().catch(() => {}); }, []);

  const filteredItems = useMemo(() => {
    const filtered = filterTimelineOptimizerItems(items, filters);
    return sortTimelineOptimizerItems(filtered, filters.sortBy, filters.sortOrder);
  }, [items, filters]);

  const progress = useMemo(() => calculateTimelineOptimizerProgress(items), [items]);
  const selected = useMemo(() => getSelected(), [items, selectedId]);
  const refresh = useCallback(() => fetchItems(), [fetchItems]);

  return { items, filteredItems, loading, error, filters, stats, selectedId, selected, progress, fetchItems, addItem, updateItem, deleteItem, setFilters, selectItem, clearSelection, clearError, refresh };
}
export default useTimelineOptimizer;
