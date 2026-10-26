/**
 * useVirtualWeddingSupport hook
 */
import { useCallback, useEffect, useMemo } from 'react';
import useVirtualWeddingSupportStore from '../store';
import { filterVirtualWeddingSupportItems, sortVirtualWeddingSupportItems, calculateVirtualWeddingSupportProgress } from '../utils/helpers';

export function useVirtualWeddingSupport() {
  const items = useVirtualWeddingSupportStore((s) => s.items);
  const loading = useVirtualWeddingSupportStore((s) => s.loading);
  const error = useVirtualWeddingSupportStore((s) => s.error);
  const filters = useVirtualWeddingSupportStore((s) => s.filters);
  const stats = useVirtualWeddingSupportStore((s) => s.stats);
  const selectedId = useVirtualWeddingSupportStore((s) => s.selectedId);
  const fetchItems = useVirtualWeddingSupportStore((s) => s.fetchItems);
  const addItem = useVirtualWeddingSupportStore((s) => s.addItem);
  const updateItem = useVirtualWeddingSupportStore((s) => s.updateItem);
  const deleteItem = useVirtualWeddingSupportStore((s) => s.deleteItem);
  const setFilters = useVirtualWeddingSupportStore((s) => s.setFilters);
  const selectItem = useVirtualWeddingSupportStore((s) => s.selectItem);
  const clearSelection = useVirtualWeddingSupportStore((s) => s.clearSelection);
  const clearError = useVirtualWeddingSupportStore((s) => s.clearError);
  const getSelected = useVirtualWeddingSupportStore((s) => s.getSelected);

  useEffect(() => { fetchItems().catch(() => {}); }, []);

  const filteredItems = useMemo(() => {
    const filtered = filterVirtualWeddingSupportItems(items, filters);
    return sortVirtualWeddingSupportItems(filtered, filters.sortBy, filters.sortOrder);
  }, [items, filters]);

  const progress = useMemo(() => calculateVirtualWeddingSupportProgress(items), [items]);
  const selected = useMemo(() => getSelected(), [items, selectedId]);
  const refresh = useCallback(() => fetchItems(), [fetchItems]);

  return { items, filteredItems, loading, error, filters, stats, selectedId, selected, progress, fetchItems, addItem, updateItem, deleteItem, setFilters, selectItem, clearSelection, clearError, refresh };
}
export default useVirtualWeddingSupport;
