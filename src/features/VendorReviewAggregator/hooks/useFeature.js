/**
 * useVendorReviewAggregator hook
 */
import { useCallback, useEffect, useMemo } from 'react';
import useVendorReviewAggregatorStore from '../store';
import { filterVendorReviewAggregatorItems, sortVendorReviewAggregatorItems, calculateVendorReviewAggregatorProgress } from '../utils/helpers';

export function useVendorReviewAggregator() {
  const items = useVendorReviewAggregatorStore((s) => s.items);
  const loading = useVendorReviewAggregatorStore((s) => s.loading);
  const error = useVendorReviewAggregatorStore((s) => s.error);
  const filters = useVendorReviewAggregatorStore((s) => s.filters);
  const stats = useVendorReviewAggregatorStore((s) => s.stats);
  const selectedId = useVendorReviewAggregatorStore((s) => s.selectedId);
  const fetchItems = useVendorReviewAggregatorStore((s) => s.fetchItems);
  const addItem = useVendorReviewAggregatorStore((s) => s.addItem);
  const updateItem = useVendorReviewAggregatorStore((s) => s.updateItem);
  const deleteItem = useVendorReviewAggregatorStore((s) => s.deleteItem);
  const setFilters = useVendorReviewAggregatorStore((s) => s.setFilters);
  const selectItem = useVendorReviewAggregatorStore((s) => s.selectItem);
  const clearSelection = useVendorReviewAggregatorStore((s) => s.clearSelection);
  const clearError = useVendorReviewAggregatorStore((s) => s.clearError);
  const getSelected = useVendorReviewAggregatorStore((s) => s.getSelected);

  useEffect(() => { fetchItems().catch(() => {}); }, []);

  const filteredItems = useMemo(() => {
    const filtered = filterVendorReviewAggregatorItems(items, filters);
    return sortVendorReviewAggregatorItems(filtered, filters.sortBy, filters.sortOrder);
  }, [items, filters]);

  const progress = useMemo(() => calculateVendorReviewAggregatorProgress(items), [items]);
  const selected = useMemo(() => getSelected(), [items, selectedId]);
  const refresh = useCallback(() => fetchItems(), [fetchItems]);

  return { items, filteredItems, loading, error, filters, stats, selectedId, selected, progress, fetchItems, addItem, updateItem, deleteItem, setFilters, selectItem, clearSelection, clearError, refresh };
}
export default useVendorReviewAggregator;
