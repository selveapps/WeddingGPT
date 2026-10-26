/**
 * useDanceFloorCoordinator hook
 */
import { useCallback, useEffect, useMemo } from 'react';
import useDanceFloorCoordinatorStore from '../store';
import { filterDanceFloorCoordinatorItems, sortDanceFloorCoordinatorItems, calculateDanceFloorCoordinatorProgress } from '../utils/helpers';

export function useDanceFloorCoordinator() {
  const items = useDanceFloorCoordinatorStore((s) => s.items);
  const loading = useDanceFloorCoordinatorStore((s) => s.loading);
  const error = useDanceFloorCoordinatorStore((s) => s.error);
  const filters = useDanceFloorCoordinatorStore((s) => s.filters);
  const stats = useDanceFloorCoordinatorStore((s) => s.stats);
  const selectedId = useDanceFloorCoordinatorStore((s) => s.selectedId);
  const fetchItems = useDanceFloorCoordinatorStore((s) => s.fetchItems);
  const addItem = useDanceFloorCoordinatorStore((s) => s.addItem);
  const updateItem = useDanceFloorCoordinatorStore((s) => s.updateItem);
  const deleteItem = useDanceFloorCoordinatorStore((s) => s.deleteItem);
  const setFilters = useDanceFloorCoordinatorStore((s) => s.setFilters);
  const selectItem = useDanceFloorCoordinatorStore((s) => s.selectItem);
  const clearSelection = useDanceFloorCoordinatorStore((s) => s.clearSelection);
  const clearError = useDanceFloorCoordinatorStore((s) => s.clearError);
  const getSelected = useDanceFloorCoordinatorStore((s) => s.getSelected);

  useEffect(() => { fetchItems().catch(() => {}); }, []);

  const filteredItems = useMemo(() => {
    const filtered = filterDanceFloorCoordinatorItems(items, filters);
    return sortDanceFloorCoordinatorItems(filtered, filters.sortBy, filters.sortOrder);
  }, [items, filters]);

  const progress = useMemo(() => calculateDanceFloorCoordinatorProgress(items), [items]);
  const selected = useMemo(() => getSelected(), [items, selectedId]);
  const refresh = useCallback(() => fetchItems(), [fetchItems]);

  return { items, filteredItems, loading, error, filters, stats, selectedId, selected, progress, fetchItems, addItem, updateItem, deleteItem, setFilters, selectItem, clearSelection, clearError, refresh };
}
export default useDanceFloorCoordinator;
