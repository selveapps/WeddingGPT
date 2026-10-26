/**
 * useSustainabilityTracker hook
 */
import { useCallback, useEffect, useMemo } from 'react';
import useSustainabilityTrackerStore from '../store';
import { filterSustainabilityTrackerItems, sortSustainabilityTrackerItems, calculateSustainabilityTrackerProgress } from '../utils/helpers';

export function useSustainabilityTracker() {
  const items = useSustainabilityTrackerStore((s) => s.items);
  const loading = useSustainabilityTrackerStore((s) => s.loading);
  const error = useSustainabilityTrackerStore((s) => s.error);
  const filters = useSustainabilityTrackerStore((s) => s.filters);
  const stats = useSustainabilityTrackerStore((s) => s.stats);
  const selectedId = useSustainabilityTrackerStore((s) => s.selectedId);
  const fetchItems = useSustainabilityTrackerStore((s) => s.fetchItems);
  const addItem = useSustainabilityTrackerStore((s) => s.addItem);
  const updateItem = useSustainabilityTrackerStore((s) => s.updateItem);
  const deleteItem = useSustainabilityTrackerStore((s) => s.deleteItem);
  const setFilters = useSustainabilityTrackerStore((s) => s.setFilters);
  const selectItem = useSustainabilityTrackerStore((s) => s.selectItem);
  const clearSelection = useSustainabilityTrackerStore((s) => s.clearSelection);
  const clearError = useSustainabilityTrackerStore((s) => s.clearError);
  const getSelected = useSustainabilityTrackerStore((s) => s.getSelected);

  useEffect(() => { fetchItems().catch(() => {}); }, []);

  const filteredItems = useMemo(() => {
    const filtered = filterSustainabilityTrackerItems(items, filters);
    return sortSustainabilityTrackerItems(filtered, filters.sortBy, filters.sortOrder);
  }, [items, filters]);

  const progress = useMemo(() => calculateSustainabilityTrackerProgress(items), [items]);
  const selected = useMemo(() => getSelected(), [items, selectedId]);
  const refresh = useCallback(() => fetchItems(), [fetchItems]);

  return { items, filteredItems, loading, error, filters, stats, selectedId, selected, progress, fetchItems, addItem, updateItem, deleteItem, setFilters, selectItem, clearSelection, clearError, refresh };
}
export default useSustainabilityTracker;
