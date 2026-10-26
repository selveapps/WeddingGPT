/**
 * useHoneymoonPlannerAdvanced hook
 */
import { useCallback, useEffect, useMemo } from 'react';
import useHoneymoonPlannerAdvancedStore from '../store';
import { filterHoneymoonPlannerAdvancedItems, sortHoneymoonPlannerAdvancedItems, calculateHoneymoonPlannerAdvancedProgress } from '../utils/helpers';

export function useHoneymoonPlannerAdvanced() {
  const items = useHoneymoonPlannerAdvancedStore((s) => s.items);
  const loading = useHoneymoonPlannerAdvancedStore((s) => s.loading);
  const error = useHoneymoonPlannerAdvancedStore((s) => s.error);
  const filters = useHoneymoonPlannerAdvancedStore((s) => s.filters);
  const stats = useHoneymoonPlannerAdvancedStore((s) => s.stats);
  const selectedId = useHoneymoonPlannerAdvancedStore((s) => s.selectedId);
  const fetchItems = useHoneymoonPlannerAdvancedStore((s) => s.fetchItems);
  const addItem = useHoneymoonPlannerAdvancedStore((s) => s.addItem);
  const updateItem = useHoneymoonPlannerAdvancedStore((s) => s.updateItem);
  const deleteItem = useHoneymoonPlannerAdvancedStore((s) => s.deleteItem);
  const setFilters = useHoneymoonPlannerAdvancedStore((s) => s.setFilters);
  const selectItem = useHoneymoonPlannerAdvancedStore((s) => s.selectItem);
  const clearSelection = useHoneymoonPlannerAdvancedStore((s) => s.clearSelection);
  const clearError = useHoneymoonPlannerAdvancedStore((s) => s.clearError);
  const getSelected = useHoneymoonPlannerAdvancedStore((s) => s.getSelected);

  useEffect(() => { fetchItems().catch(() => {}); }, []);

  const filteredItems = useMemo(() => {
    const filtered = filterHoneymoonPlannerAdvancedItems(items, filters);
    return sortHoneymoonPlannerAdvancedItems(filtered, filters.sortBy, filters.sortOrder);
  }, [items, filters]);

  const progress = useMemo(() => calculateHoneymoonPlannerAdvancedProgress(items), [items]);
  const selected = useMemo(() => getSelected(), [items, selectedId]);
  const refresh = useCallback(() => fetchItems(), [fetchItems]);

  return { items, filteredItems, loading, error, filters, stats, selectedId, selected, progress, fetchItems, addItem, updateItem, deleteItem, setFilters, selectItem, clearSelection, clearError, refresh };
}
export default useHoneymoonPlannerAdvanced;
