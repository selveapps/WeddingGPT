/**
 * useEmergencyKitPlanner hook
 */
import { useCallback, useEffect, useMemo } from 'react';
import useEmergencyKitPlannerStore from '../store';
import { filterEmergencyKitPlannerItems, sortEmergencyKitPlannerItems, calculateEmergencyKitPlannerProgress } from '../utils/helpers';

export function useEmergencyKitPlanner() {
  const items = useEmergencyKitPlannerStore((s) => s.items);
  const loading = useEmergencyKitPlannerStore((s) => s.loading);
  const error = useEmergencyKitPlannerStore((s) => s.error);
  const filters = useEmergencyKitPlannerStore((s) => s.filters);
  const stats = useEmergencyKitPlannerStore((s) => s.stats);
  const selectedId = useEmergencyKitPlannerStore((s) => s.selectedId);
  const fetchItems = useEmergencyKitPlannerStore((s) => s.fetchItems);
  const addItem = useEmergencyKitPlannerStore((s) => s.addItem);
  const updateItem = useEmergencyKitPlannerStore((s) => s.updateItem);
  const deleteItem = useEmergencyKitPlannerStore((s) => s.deleteItem);
  const setFilters = useEmergencyKitPlannerStore((s) => s.setFilters);
  const selectItem = useEmergencyKitPlannerStore((s) => s.selectItem);
  const clearSelection = useEmergencyKitPlannerStore((s) => s.clearSelection);
  const clearError = useEmergencyKitPlannerStore((s) => s.clearError);
  const getSelected = useEmergencyKitPlannerStore((s) => s.getSelected);

  useEffect(() => { fetchItems().catch(() => {}); }, []);

  const filteredItems = useMemo(() => {
    const filtered = filterEmergencyKitPlannerItems(items, filters);
    return sortEmergencyKitPlannerItems(filtered, filters.sortBy, filters.sortOrder);
  }, [items, filters]);

  const progress = useMemo(() => calculateEmergencyKitPlannerProgress(items), [items]);
  const selected = useMemo(() => getSelected(), [items, selectedId]);
  const refresh = useCallback(() => fetchItems(), [fetchItems]);

  return { items, filteredItems, loading, error, filters, stats, selectedId, selected, progress, fetchItems, addItem, updateItem, deleteItem, setFilters, selectItem, clearSelection, clearError, refresh };
}
export default useEmergencyKitPlanner;
