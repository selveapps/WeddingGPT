/**
 * useAnniversaryPlanner hook
 */
import { useCallback, useEffect, useMemo } from 'react';
import useAnniversaryPlannerStore from '../store';
import { filterAnniversaryPlannerItems, sortAnniversaryPlannerItems, calculateAnniversaryPlannerProgress } from '../utils/helpers';

export function useAnniversaryPlanner() {
  const items = useAnniversaryPlannerStore((s) => s.items);
  const loading = useAnniversaryPlannerStore((s) => s.loading);
  const error = useAnniversaryPlannerStore((s) => s.error);
  const filters = useAnniversaryPlannerStore((s) => s.filters);
  const stats = useAnniversaryPlannerStore((s) => s.stats);
  const selectedId = useAnniversaryPlannerStore((s) => s.selectedId);
  const fetchItems = useAnniversaryPlannerStore((s) => s.fetchItems);
  const addItem = useAnniversaryPlannerStore((s) => s.addItem);
  const updateItem = useAnniversaryPlannerStore((s) => s.updateItem);
  const deleteItem = useAnniversaryPlannerStore((s) => s.deleteItem);
  const setFilters = useAnniversaryPlannerStore((s) => s.setFilters);
  const selectItem = useAnniversaryPlannerStore((s) => s.selectItem);
  const clearSelection = useAnniversaryPlannerStore((s) => s.clearSelection);
  const clearError = useAnniversaryPlannerStore((s) => s.clearError);
  const getSelected = useAnniversaryPlannerStore((s) => s.getSelected);

  useEffect(() => { fetchItems().catch(() => {}); }, []);

  const filteredItems = useMemo(() => {
    const filtered = filterAnniversaryPlannerItems(items, filters);
    return sortAnniversaryPlannerItems(filtered, filters.sortBy, filters.sortOrder);
  }, [items, filters]);

  const progress = useMemo(() => calculateAnniversaryPlannerProgress(items), [items]);
  const selected = useMemo(() => getSelected(), [items, selectedId]);
  const refresh = useCallback(() => fetchItems(), [fetchItems]);

  return { items, filteredItems, loading, error, filters, stats, selectedId, selected, progress, fetchItems, addItem, updateItem, deleteItem, setFilters, selectItem, clearSelection, clearError, refresh };
}
export default useAnniversaryPlanner;
