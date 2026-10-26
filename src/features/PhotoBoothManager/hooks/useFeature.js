/**
 * usePhotoBoothManager hook
 */
import { useCallback, useEffect, useMemo } from 'react';
import usePhotoBoothManagerStore from '../store';
import { filterPhotoBoothManagerItems, sortPhotoBoothManagerItems, calculatePhotoBoothManagerProgress } from '../utils/helpers';

export function usePhotoBoothManager() {
  const items = usePhotoBoothManagerStore((s) => s.items);
  const loading = usePhotoBoothManagerStore((s) => s.loading);
  const error = usePhotoBoothManagerStore((s) => s.error);
  const filters = usePhotoBoothManagerStore((s) => s.filters);
  const stats = usePhotoBoothManagerStore((s) => s.stats);
  const selectedId = usePhotoBoothManagerStore((s) => s.selectedId);
  const fetchItems = usePhotoBoothManagerStore((s) => s.fetchItems);
  const addItem = usePhotoBoothManagerStore((s) => s.addItem);
  const updateItem = usePhotoBoothManagerStore((s) => s.updateItem);
  const deleteItem = usePhotoBoothManagerStore((s) => s.deleteItem);
  const setFilters = usePhotoBoothManagerStore((s) => s.setFilters);
  const selectItem = usePhotoBoothManagerStore((s) => s.selectItem);
  const clearSelection = usePhotoBoothManagerStore((s) => s.clearSelection);
  const clearError = usePhotoBoothManagerStore((s) => s.clearError);
  const getSelected = usePhotoBoothManagerStore((s) => s.getSelected);

  useEffect(() => { fetchItems().catch(() => {}); }, []);

  const filteredItems = useMemo(() => {
    const filtered = filterPhotoBoothManagerItems(items, filters);
    return sortPhotoBoothManagerItems(filtered, filters.sortBy, filters.sortOrder);
  }, [items, filters]);

  const progress = useMemo(() => calculatePhotoBoothManagerProgress(items), [items]);
  const selected = useMemo(() => getSelected(), [items, selectedId]);
  const refresh = useCallback(() => fetchItems(), [fetchItems]);

  return { items, filteredItems, loading, error, filters, stats, selectedId, selected, progress, fetchItems, addItem, updateItem, deleteItem, setFilters, selectItem, clearSelection, clearError, refresh };
}
export default usePhotoBoothManager;
