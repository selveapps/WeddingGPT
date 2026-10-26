/**
 * useVendorContractTracker hook
 */
import { useCallback, useEffect, useMemo } from 'react';
import useVendorContractTrackerStore from '../store';
import { filterVendorContractTrackerItems, sortVendorContractTrackerItems, calculateVendorContractTrackerProgress } from '../utils/helpers';

export function useVendorContractTracker() {
  const items = useVendorContractTrackerStore((s) => s.items);
  const loading = useVendorContractTrackerStore((s) => s.loading);
  const error = useVendorContractTrackerStore((s) => s.error);
  const filters = useVendorContractTrackerStore((s) => s.filters);
  const stats = useVendorContractTrackerStore((s) => s.stats);
  const selectedId = useVendorContractTrackerStore((s) => s.selectedId);
  const fetchItems = useVendorContractTrackerStore((s) => s.fetchItems);
  const addItem = useVendorContractTrackerStore((s) => s.addItem);
  const updateItem = useVendorContractTrackerStore((s) => s.updateItem);
  const deleteItem = useVendorContractTrackerStore((s) => s.deleteItem);
  const setFilters = useVendorContractTrackerStore((s) => s.setFilters);
  const selectItem = useVendorContractTrackerStore((s) => s.selectItem);
  const clearSelection = useVendorContractTrackerStore((s) => s.clearSelection);
  const clearError = useVendorContractTrackerStore((s) => s.clearError);
  const getSelected = useVendorContractTrackerStore((s) => s.getSelected);

  useEffect(() => { fetchItems().catch(() => {}); }, []);

  const filteredItems = useMemo(() => {
    const filtered = filterVendorContractTrackerItems(items, filters);
    return sortVendorContractTrackerItems(filtered, filters.sortBy, filters.sortOrder);
  }, [items, filters]);

  const progress = useMemo(() => calculateVendorContractTrackerProgress(items), [items]);
  const selected = useMemo(() => getSelected(), [items, selectedId]);
  const refresh = useCallback(() => fetchItems(), [fetchItems]);

  return { items, filteredItems, loading, error, filters, stats, selectedId, selected, progress, fetchItems, addItem, updateItem, deleteItem, setFilters, selectItem, clearSelection, clearError, refresh };
}
export default useVendorContractTracker;
