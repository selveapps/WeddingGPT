/**
 * useFloristManager hook
 */
import { useCallback, useEffect, useMemo } from 'react';
import useFloristManagerStore from '../store';
import { filterFloristManagerItems, sortFloristManagerItems, calculateFloristManagerProgress } from '../utils/helpers';

export function useFloristManager() {
  const items = useFloristManagerStore((s) => s.items);
  const loading = useFloristManagerStore((s) => s.loading);
  const error = useFloristManagerStore((s) => s.error);
  const filters = useFloristManagerStore((s) => s.filters);
  const stats = useFloristManagerStore((s) => s.stats);
  const selectedId = useFloristManagerStore((s) => s.selectedId);
  const fetchItems = useFloristManagerStore((s) => s.fetchItems);
  const addItem = useFloristManagerStore((s) => s.addItem);
  const updateItem = useFloristManagerStore((s) => s.updateItem);
  const deleteItem = useFloristManagerStore((s) => s.deleteItem);
  const setFilters = useFloristManagerStore((s) => s.setFilters);
  const selectItem = useFloristManagerStore((s) => s.selectItem);
  const clearSelection = useFloristManagerStore((s) => s.clearSelection);
  const clearError = useFloristManagerStore((s) => s.clearError);
  const getSelected = useFloristManagerStore((s) => s.getSelected);

  useEffect(() => { fetchItems().catch(() => {}); }, []);

  const filteredItems = useMemo(() => {
    const filtered = filterFloristManagerItems(items, filters);
    return sortFloristManagerItems(filtered, filters.sortBy, filters.sortOrder);
  }, [items, filters]);

  const progress = useMemo(() => calculateFloristManagerProgress(items), [items]);
  const selected = useMemo(() => getSelected(), [items, selectedId]);
  const refresh = useCallback(() => fetchItems(), [fetchItems]);

  return { items, filteredItems, loading, error, filters, stats, selectedId, selected, progress, fetchItems, addItem, updateItem, deleteItem, setFilters, selectItem, clearSelection, clearError, refresh };
}
export default useFloristManager;
