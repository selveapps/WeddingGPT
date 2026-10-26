/**
 * useGiftRegistryPro hook
 */
import { useCallback, useEffect, useMemo } from 'react';
import useGiftRegistryProStore from '../store';
import { filterGiftRegistryProItems, sortGiftRegistryProItems, calculateGiftRegistryProProgress } from '../utils/helpers';

export function useGiftRegistryPro() {
  const items = useGiftRegistryProStore((s) => s.items);
  const loading = useGiftRegistryProStore((s) => s.loading);
  const error = useGiftRegistryProStore((s) => s.error);
  const filters = useGiftRegistryProStore((s) => s.filters);
  const stats = useGiftRegistryProStore((s) => s.stats);
  const selectedId = useGiftRegistryProStore((s) => s.selectedId);
  const fetchItems = useGiftRegistryProStore((s) => s.fetchItems);
  const addItem = useGiftRegistryProStore((s) => s.addItem);
  const updateItem = useGiftRegistryProStore((s) => s.updateItem);
  const deleteItem = useGiftRegistryProStore((s) => s.deleteItem);
  const setFilters = useGiftRegistryProStore((s) => s.setFilters);
  const selectItem = useGiftRegistryProStore((s) => s.selectItem);
  const clearSelection = useGiftRegistryProStore((s) => s.clearSelection);
  const clearError = useGiftRegistryProStore((s) => s.clearError);
  const getSelected = useGiftRegistryProStore((s) => s.getSelected);

  useEffect(() => { fetchItems().catch(() => {}); }, []);

  const filteredItems = useMemo(() => {
    const filtered = filterGiftRegistryProItems(items, filters);
    return sortGiftRegistryProItems(filtered, filters.sortBy, filters.sortOrder);
  }, [items, filters]);

  const progress = useMemo(() => calculateGiftRegistryProProgress(items), [items]);
  const selected = useMemo(() => getSelected(), [items, selectedId]);
  const refresh = useCallback(() => fetchItems(), [fetchItems]);

  return { items, filteredItems, loading, error, filters, stats, selectedId, selected, progress, fetchItems, addItem, updateItem, deleteItem, setFilters, selectItem, clearSelection, clearError, refresh };
}
export default useGiftRegistryPro;
