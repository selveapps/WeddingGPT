/**
 * useGuestTransportation hook
 */
import { useCallback, useEffect, useMemo } from 'react';
import useGuestTransportationStore from '../store';
import { filterGuestTransportationItems, sortGuestTransportationItems, calculateGuestTransportationProgress } from '../utils/helpers';

export function useGuestTransportation() {
  const items = useGuestTransportationStore((s) => s.items);
  const loading = useGuestTransportationStore((s) => s.loading);
  const error = useGuestTransportationStore((s) => s.error);
  const filters = useGuestTransportationStore((s) => s.filters);
  const stats = useGuestTransportationStore((s) => s.stats);
  const selectedId = useGuestTransportationStore((s) => s.selectedId);
  const fetchItems = useGuestTransportationStore((s) => s.fetchItems);
  const addItem = useGuestTransportationStore((s) => s.addItem);
  const updateItem = useGuestTransportationStore((s) => s.updateItem);
  const deleteItem = useGuestTransportationStore((s) => s.deleteItem);
  const setFilters = useGuestTransportationStore((s) => s.setFilters);
  const selectItem = useGuestTransportationStore((s) => s.selectItem);
  const clearSelection = useGuestTransportationStore((s) => s.clearSelection);
  const clearError = useGuestTransportationStore((s) => s.clearError);
  const getSelected = useGuestTransportationStore((s) => s.getSelected);

  useEffect(() => { fetchItems().catch(() => {}); }, []);

  const filteredItems = useMemo(() => {
    const filtered = filterGuestTransportationItems(items, filters);
    return sortGuestTransportationItems(filtered, filters.sortBy, filters.sortOrder);
  }, [items, filters]);

  const progress = useMemo(() => calculateGuestTransportationProgress(items), [items]);
  const selected = useMemo(() => getSelected(), [items, selectedId]);
  const refresh = useCallback(() => fetchItems(), [fetchItems]);

  return { items, filteredItems, loading, error, filters, stats, selectedId, selected, progress, fetchItems, addItem, updateItem, deleteItem, setFilters, selectItem, clearSelection, clearError, refresh };
}
export default useGuestTransportation;
