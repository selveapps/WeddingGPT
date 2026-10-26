/**
 * useLiveStreamingManager hook
 */
import { useCallback, useEffect, useMemo } from 'react';
import useLiveStreamingManagerStore from '../store';
import { filterLiveStreamingManagerItems, sortLiveStreamingManagerItems, calculateLiveStreamingManagerProgress } from '../utils/helpers';

export function useLiveStreamingManager() {
  const items = useLiveStreamingManagerStore((s) => s.items);
  const loading = useLiveStreamingManagerStore((s) => s.loading);
  const error = useLiveStreamingManagerStore((s) => s.error);
  const filters = useLiveStreamingManagerStore((s) => s.filters);
  const stats = useLiveStreamingManagerStore((s) => s.stats);
  const selectedId = useLiveStreamingManagerStore((s) => s.selectedId);
  const fetchItems = useLiveStreamingManagerStore((s) => s.fetchItems);
  const addItem = useLiveStreamingManagerStore((s) => s.addItem);
  const updateItem = useLiveStreamingManagerStore((s) => s.updateItem);
  const deleteItem = useLiveStreamingManagerStore((s) => s.deleteItem);
  const setFilters = useLiveStreamingManagerStore((s) => s.setFilters);
  const selectItem = useLiveStreamingManagerStore((s) => s.selectItem);
  const clearSelection = useLiveStreamingManagerStore((s) => s.clearSelection);
  const clearError = useLiveStreamingManagerStore((s) => s.clearError);
  const getSelected = useLiveStreamingManagerStore((s) => s.getSelected);

  useEffect(() => { fetchItems().catch(() => {}); }, []);

  const filteredItems = useMemo(() => {
    const filtered = filterLiveStreamingManagerItems(items, filters);
    return sortLiveStreamingManagerItems(filtered, filters.sortBy, filters.sortOrder);
  }, [items, filters]);

  const progress = useMemo(() => calculateLiveStreamingManagerProgress(items), [items]);
  const selected = useMemo(() => getSelected(), [items, selectedId]);
  const refresh = useCallback(() => fetchItems(), [fetchItems]);

  return { items, filteredItems, loading, error, filters, stats, selectedId, selected, progress, fetchItems, addItem, updateItem, deleteItem, setFilters, selectItem, clearSelection, clearError, refresh };
}
export default useLiveStreamingManager;
