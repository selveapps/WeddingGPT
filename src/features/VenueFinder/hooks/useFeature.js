/**
 * useVenueFinder hook
 */
import { useCallback, useEffect, useMemo } from 'react';
import useVenueFinderStore from '../store';
import { filterVenueFinderItems, sortVenueFinderItems, calculateVenueFinderProgress } from '../utils/helpers';

export function useVenueFinder() {
  const items = useVenueFinderStore((s) => s.items);
  const loading = useVenueFinderStore((s) => s.loading);
  const error = useVenueFinderStore((s) => s.error);
  const filters = useVenueFinderStore((s) => s.filters);
  const stats = useVenueFinderStore((s) => s.stats);
  const selectedId = useVenueFinderStore((s) => s.selectedId);
  const fetchItems = useVenueFinderStore((s) => s.fetchItems);
  const addItem = useVenueFinderStore((s) => s.addItem);
  const updateItem = useVenueFinderStore((s) => s.updateItem);
  const deleteItem = useVenueFinderStore((s) => s.deleteItem);
  const setFilters = useVenueFinderStore((s) => s.setFilters);
  const selectItem = useVenueFinderStore((s) => s.selectItem);
  const clearSelection = useVenueFinderStore((s) => s.clearSelection);
  const clearError = useVenueFinderStore((s) => s.clearError);
  const getSelected = useVenueFinderStore((s) => s.getSelected);

  useEffect(() => { fetchItems().catch(() => {}); }, []);

  const filteredItems = useMemo(() => {
    const filtered = filterVenueFinderItems(items, filters);
    return sortVenueFinderItems(filtered, filters.sortBy, filters.sortOrder);
  }, [items, filters]);

  const progress = useMemo(() => calculateVenueFinderProgress(items), [items]);
  const selected = useMemo(() => getSelected(), [items, selectedId]);
  const refresh = useCallback(() => fetchItems(), [fetchItems]);

  return { items, filteredItems, loading, error, filters, stats, selectedId, selected, progress, fetchItems, addItem, updateItem, deleteItem, setFilters, selectItem, clearSelection, clearError, refresh };
}
export default useVenueFinder;
