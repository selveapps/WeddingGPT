/**
 * useThemeMoodboard hook
 */
import { useCallback, useEffect, useMemo } from 'react';
import useThemeMoodboardStore from '../store';
import { filterThemeMoodboardItems, sortThemeMoodboardItems, calculateThemeMoodboardProgress } from '../utils/helpers';

export function useThemeMoodboard() {
  const items = useThemeMoodboardStore((s) => s.items);
  const loading = useThemeMoodboardStore((s) => s.loading);
  const error = useThemeMoodboardStore((s) => s.error);
  const filters = useThemeMoodboardStore((s) => s.filters);
  const stats = useThemeMoodboardStore((s) => s.stats);
  const selectedId = useThemeMoodboardStore((s) => s.selectedId);
  const fetchItems = useThemeMoodboardStore((s) => s.fetchItems);
  const addItem = useThemeMoodboardStore((s) => s.addItem);
  const updateItem = useThemeMoodboardStore((s) => s.updateItem);
  const deleteItem = useThemeMoodboardStore((s) => s.deleteItem);
  const setFilters = useThemeMoodboardStore((s) => s.setFilters);
  const selectItem = useThemeMoodboardStore((s) => s.selectItem);
  const clearSelection = useThemeMoodboardStore((s) => s.clearSelection);
  const clearError = useThemeMoodboardStore((s) => s.clearError);
  const getSelected = useThemeMoodboardStore((s) => s.getSelected);

  useEffect(() => { fetchItems().catch(() => {}); }, []);

  const filteredItems = useMemo(() => {
    const filtered = filterThemeMoodboardItems(items, filters);
    return sortThemeMoodboardItems(filtered, filters.sortBy, filters.sortOrder);
  }, [items, filters]);

  const progress = useMemo(() => calculateThemeMoodboardProgress(items), [items]);
  const selected = useMemo(() => getSelected(), [items, selectedId]);
  const refresh = useCallback(() => fetchItems(), [fetchItems]);

  return { items, filteredItems, loading, error, filters, stats, selectedId, selected, progress, fetchItems, addItem, updateItem, deleteItem, setFilters, selectItem, clearSelection, clearError, refresh };
}
export default useThemeMoodboard;
