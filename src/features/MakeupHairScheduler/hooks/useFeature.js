/**
 * useMakeupHairScheduler hook
 */
import { useCallback, useEffect, useMemo } from 'react';
import useMakeupHairSchedulerStore from '../store';
import { filterMakeupHairSchedulerItems, sortMakeupHairSchedulerItems, calculateMakeupHairSchedulerProgress } from '../utils/helpers';

export function useMakeupHairScheduler() {
  const items = useMakeupHairSchedulerStore((s) => s.items);
  const loading = useMakeupHairSchedulerStore((s) => s.loading);
  const error = useMakeupHairSchedulerStore((s) => s.error);
  const filters = useMakeupHairSchedulerStore((s) => s.filters);
  const stats = useMakeupHairSchedulerStore((s) => s.stats);
  const selectedId = useMakeupHairSchedulerStore((s) => s.selectedId);
  const fetchItems = useMakeupHairSchedulerStore((s) => s.fetchItems);
  const addItem = useMakeupHairSchedulerStore((s) => s.addItem);
  const updateItem = useMakeupHairSchedulerStore((s) => s.updateItem);
  const deleteItem = useMakeupHairSchedulerStore((s) => s.deleteItem);
  const setFilters = useMakeupHairSchedulerStore((s) => s.setFilters);
  const selectItem = useMakeupHairSchedulerStore((s) => s.selectItem);
  const clearSelection = useMakeupHairSchedulerStore((s) => s.clearSelection);
  const clearError = useMakeupHairSchedulerStore((s) => s.clearError);
  const getSelected = useMakeupHairSchedulerStore((s) => s.getSelected);

  useEffect(() => { fetchItems().catch(() => {}); }, []);

  const filteredItems = useMemo(() => {
    const filtered = filterMakeupHairSchedulerItems(items, filters);
    return sortMakeupHairSchedulerItems(filtered, filters.sortBy, filters.sortOrder);
  }, [items, filters]);

  const progress = useMemo(() => calculateMakeupHairSchedulerProgress(items), [items]);
  const selected = useMemo(() => getSelected(), [items, selectedId]);
  const refresh = useCallback(() => fetchItems(), [fetchItems]);

  return { items, filteredItems, loading, error, filters, stats, selectedId, selected, progress, fetchItems, addItem, updateItem, deleteItem, setFilters, selectItem, clearSelection, clearError, refresh };
}
export default useMakeupHairScheduler;
