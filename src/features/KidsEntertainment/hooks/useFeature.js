/**
 * useKidsEntertainment hook
 */
import { useCallback, useEffect, useMemo } from 'react';
import useKidsEntertainmentStore from '../store';
import { filterKidsEntertainmentItems, sortKidsEntertainmentItems, calculateKidsEntertainmentProgress } from '../utils/helpers';

export function useKidsEntertainment() {
  const items = useKidsEntertainmentStore((s) => s.items);
  const loading = useKidsEntertainmentStore((s) => s.loading);
  const error = useKidsEntertainmentStore((s) => s.error);
  const filters = useKidsEntertainmentStore((s) => s.filters);
  const stats = useKidsEntertainmentStore((s) => s.stats);
  const selectedId = useKidsEntertainmentStore((s) => s.selectedId);
  const fetchItems = useKidsEntertainmentStore((s) => s.fetchItems);
  const addItem = useKidsEntertainmentStore((s) => s.addItem);
  const updateItem = useKidsEntertainmentStore((s) => s.updateItem);
  const deleteItem = useKidsEntertainmentStore((s) => s.deleteItem);
  const setFilters = useKidsEntertainmentStore((s) => s.setFilters);
  const selectItem = useKidsEntertainmentStore((s) => s.selectItem);
  const clearSelection = useKidsEntertainmentStore((s) => s.clearSelection);
  const clearError = useKidsEntertainmentStore((s) => s.clearError);
  const getSelected = useKidsEntertainmentStore((s) => s.getSelected);

  useEffect(() => { fetchItems().catch(() => {}); }, []);

  const filteredItems = useMemo(() => {
    const filtered = filterKidsEntertainmentItems(items, filters);
    return sortKidsEntertainmentItems(filtered, filters.sortBy, filters.sortOrder);
  }, [items, filters]);

  const progress = useMemo(() => calculateKidsEntertainmentProgress(items), [items]);
  const selected = useMemo(() => getSelected(), [items, selectedId]);
  const refresh = useCallback(() => fetchItems(), [fetchItems]);

  return { items, filteredItems, loading, error, filters, stats, selectedId, selected, progress, fetchItems, addItem, updateItem, deleteItem, setFilters, selectItem, clearSelection, clearError, refresh };
}
export default useKidsEntertainment;
