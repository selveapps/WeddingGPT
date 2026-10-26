/**
 * useAccommodationManager hook
 */
import { useCallback, useEffect, useMemo } from 'react';
import useAccommodationManagerStore from '../store';
import { filterAccommodationManagerItems, sortAccommodationManagerItems, calculateAccommodationManagerProgress } from '../utils/helpers';

export function useAccommodationManager() {
  const items = useAccommodationManagerStore((s) => s.items);
  const loading = useAccommodationManagerStore((s) => s.loading);
  const error = useAccommodationManagerStore((s) => s.error);
  const filters = useAccommodationManagerStore((s) => s.filters);
  const stats = useAccommodationManagerStore((s) => s.stats);
  const selectedId = useAccommodationManagerStore((s) => s.selectedId);
  const fetchItems = useAccommodationManagerStore((s) => s.fetchItems);
  const addItem = useAccommodationManagerStore((s) => s.addItem);
  const updateItem = useAccommodationManagerStore((s) => s.updateItem);
  const deleteItem = useAccommodationManagerStore((s) => s.deleteItem);
  const setFilters = useAccommodationManagerStore((s) => s.setFilters);
  const selectItem = useAccommodationManagerStore((s) => s.selectItem);
  const clearSelection = useAccommodationManagerStore((s) => s.clearSelection);
  const clearError = useAccommodationManagerStore((s) => s.clearError);
  const getSelected = useAccommodationManagerStore((s) => s.getSelected);

  useEffect(() => { fetchItems().catch(() => {}); }, []);

  const filteredItems = useMemo(() => {
    const filtered = filterAccommodationManagerItems(items, filters);
    return sortAccommodationManagerItems(filtered, filters.sortBy, filters.sortOrder);
  }, [items, filters]);

  const progress = useMemo(() => calculateAccommodationManagerProgress(items), [items]);
  const selected = useMemo(() => getSelected(), [items, selectedId]);
  const refresh = useCallback(() => fetchItems(), [fetchItems]);

  return { items, filteredItems, loading, error, filters, stats, selectedId, selected, progress, fetchItems, addItem, updateItem, deleteItem, setFilters, selectItem, clearSelection, clearError, refresh };
}
export default useAccommodationManager;
