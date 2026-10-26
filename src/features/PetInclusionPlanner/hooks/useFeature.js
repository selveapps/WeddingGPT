/**
 * usePetInclusionPlanner hook
 */
import { useCallback, useEffect, useMemo } from 'react';
import usePetInclusionPlannerStore from '../store';
import { filterPetInclusionPlannerItems, sortPetInclusionPlannerItems, calculatePetInclusionPlannerProgress } from '../utils/helpers';

export function usePetInclusionPlanner() {
  const items = usePetInclusionPlannerStore((s) => s.items);
  const loading = usePetInclusionPlannerStore((s) => s.loading);
  const error = usePetInclusionPlannerStore((s) => s.error);
  const filters = usePetInclusionPlannerStore((s) => s.filters);
  const stats = usePetInclusionPlannerStore((s) => s.stats);
  const selectedId = usePetInclusionPlannerStore((s) => s.selectedId);
  const fetchItems = usePetInclusionPlannerStore((s) => s.fetchItems);
  const addItem = usePetInclusionPlannerStore((s) => s.addItem);
  const updateItem = usePetInclusionPlannerStore((s) => s.updateItem);
  const deleteItem = usePetInclusionPlannerStore((s) => s.deleteItem);
  const setFilters = usePetInclusionPlannerStore((s) => s.setFilters);
  const selectItem = usePetInclusionPlannerStore((s) => s.selectItem);
  const clearSelection = usePetInclusionPlannerStore((s) => s.clearSelection);
  const clearError = usePetInclusionPlannerStore((s) => s.clearError);
  const getSelected = usePetInclusionPlannerStore((s) => s.getSelected);

  useEffect(() => { fetchItems().catch(() => {}); }, []);

  const filteredItems = useMemo(() => {
    const filtered = filterPetInclusionPlannerItems(items, filters);
    return sortPetInclusionPlannerItems(filtered, filters.sortBy, filters.sortOrder);
  }, [items, filters]);

  const progress = useMemo(() => calculatePetInclusionPlannerProgress(items), [items]);
  const selected = useMemo(() => getSelected(), [items, selectedId]);
  const refresh = useCallback(() => fetchItems(), [fetchItems]);

  return { items, filteredItems, loading, error, filters, stats, selectedId, selected, progress, fetchItems, addItem, updateItem, deleteItem, setFilters, selectItem, clearSelection, clearError, refresh };
}
export default usePetInclusionPlanner;
