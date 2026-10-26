/**
 * useMusicPlaylistAI hook
 */
import { useCallback, useEffect, useMemo } from 'react';
import useMusicPlaylistAIStore from '../store';
import { filterMusicPlaylistAIItems, sortMusicPlaylistAIItems, calculateMusicPlaylistAIProgress } from '../utils/helpers';

export function useMusicPlaylistAI() {
  const items = useMusicPlaylistAIStore((s) => s.items);
  const loading = useMusicPlaylistAIStore((s) => s.loading);
  const error = useMusicPlaylistAIStore((s) => s.error);
  const filters = useMusicPlaylistAIStore((s) => s.filters);
  const stats = useMusicPlaylistAIStore((s) => s.stats);
  const selectedId = useMusicPlaylistAIStore((s) => s.selectedId);
  const fetchItems = useMusicPlaylistAIStore((s) => s.fetchItems);
  const addItem = useMusicPlaylistAIStore((s) => s.addItem);
  const updateItem = useMusicPlaylistAIStore((s) => s.updateItem);
  const deleteItem = useMusicPlaylistAIStore((s) => s.deleteItem);
  const setFilters = useMusicPlaylistAIStore((s) => s.setFilters);
  const selectItem = useMusicPlaylistAIStore((s) => s.selectItem);
  const clearSelection = useMusicPlaylistAIStore((s) => s.clearSelection);
  const clearError = useMusicPlaylistAIStore((s) => s.clearError);
  const getSelected = useMusicPlaylistAIStore((s) => s.getSelected);

  useEffect(() => { fetchItems().catch(() => {}); }, []);

  const filteredItems = useMemo(() => {
    const filtered = filterMusicPlaylistAIItems(items, filters);
    return sortMusicPlaylistAIItems(filtered, filters.sortBy, filters.sortOrder);
  }, [items, filters]);

  const progress = useMemo(() => calculateMusicPlaylistAIProgress(items), [items]);
  const selected = useMemo(() => getSelected(), [items, selectedId]);
  const refresh = useCallback(() => fetchItems(), [fetchItems]);

  return { items, filteredItems, loading, error, filters, stats, selectedId, selected, progress, fetchItems, addItem, updateItem, deleteItem, setFilters, selectItem, clearSelection, clearError, refresh };
}
export default useMusicPlaylistAI;
