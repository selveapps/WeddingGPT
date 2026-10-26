/**
 * useMenuTastingScheduler hook
 */
import { useCallback, useEffect, useMemo } from 'react';
import useMenuTastingSchedulerStore from '../store';
import { filterMenuTastingSchedulerItems, sortMenuTastingSchedulerItems, calculateMenuTastingSchedulerProgress } from '../utils/helpers';

export function useMenuTastingScheduler() {
  const items = useMenuTastingSchedulerStore((s) => s.items);
  const loading = useMenuTastingSchedulerStore((s) => s.loading);
  const error = useMenuTastingSchedulerStore((s) => s.error);
  const filters = useMenuTastingSchedulerStore((s) => s.filters);
  const stats = useMenuTastingSchedulerStore((s) => s.stats);
  const selectedId = useMenuTastingSchedulerStore((s) => s.selectedId);
  const fetchItems = useMenuTastingSchedulerStore((s) => s.fetchItems);
  const addItem = useMenuTastingSchedulerStore((s) => s.addItem);
  const updateItem = useMenuTastingSchedulerStore((s) => s.updateItem);
  const deleteItem = useMenuTastingSchedulerStore((s) => s.deleteItem);
  const setFilters = useMenuTastingSchedulerStore((s) => s.setFilters);
  const selectItem = useMenuTastingSchedulerStore((s) => s.selectItem);
  const clearSelection = useMenuTastingSchedulerStore((s) => s.clearSelection);
  const clearError = useMenuTastingSchedulerStore((s) => s.clearError);
  const getSelected = useMenuTastingSchedulerStore((s) => s.getSelected);

  useEffect(() => { fetchItems().catch(() => {}); }, []);

  const filteredItems = useMemo(() => {
    const filtered = filterMenuTastingSchedulerItems(items, filters);
    return sortMenuTastingSchedulerItems(filtered, filters.sortBy, filters.sortOrder);
  }, [items, filters]);

  const progress = useMemo(() => calculateMenuTastingSchedulerProgress(items), [items]);
  const selected = useMemo(() => getSelected(), [items, selectedId]);
  const refresh = useCallback(() => fetchItems(), [fetchItems]);

  return { items, filteredItems, loading, error, filters, stats, selectedId, selected, progress, fetchItems, addItem, updateItem, deleteItem, setFilters, selectItem, clearSelection, clearError, refresh };
}
export default useMenuTastingScheduler;
