/**
 * useRSVPAnalytics hook
 */
import { useCallback, useEffect, useMemo } from 'react';
import useRSVPAnalyticsStore from '../store';
import { filterRSVPAnalyticsItems, sortRSVPAnalyticsItems, calculateRSVPAnalyticsProgress } from '../utils/helpers';

export function useRSVPAnalytics() {
  const items = useRSVPAnalyticsStore((s) => s.items);
  const loading = useRSVPAnalyticsStore((s) => s.loading);
  const error = useRSVPAnalyticsStore((s) => s.error);
  const filters = useRSVPAnalyticsStore((s) => s.filters);
  const stats = useRSVPAnalyticsStore((s) => s.stats);
  const selectedId = useRSVPAnalyticsStore((s) => s.selectedId);
  const fetchItems = useRSVPAnalyticsStore((s) => s.fetchItems);
  const addItem = useRSVPAnalyticsStore((s) => s.addItem);
  const updateItem = useRSVPAnalyticsStore((s) => s.updateItem);
  const deleteItem = useRSVPAnalyticsStore((s) => s.deleteItem);
  const setFilters = useRSVPAnalyticsStore((s) => s.setFilters);
  const selectItem = useRSVPAnalyticsStore((s) => s.selectItem);
  const clearSelection = useRSVPAnalyticsStore((s) => s.clearSelection);
  const clearError = useRSVPAnalyticsStore((s) => s.clearError);
  const getSelected = useRSVPAnalyticsStore((s) => s.getSelected);

  useEffect(() => { fetchItems().catch(() => {}); }, []);

  const filteredItems = useMemo(() => {
    const filtered = filterRSVPAnalyticsItems(items, filters);
    return sortRSVPAnalyticsItems(filtered, filters.sortBy, filters.sortOrder);
  }, [items, filters]);

  const progress = useMemo(() => calculateRSVPAnalyticsProgress(items), [items]);
  const selected = useMemo(() => getSelected(), [items, selectedId]);
  const refresh = useCallback(() => fetchItems(), [fetchItems]);

  return { items, filteredItems, loading, error, filters, stats, selectedId, selected, progress, fetchItems, addItem, updateItem, deleteItem, setFilters, selectItem, clearSelection, clearError, refresh };
}
export default useRSVPAnalytics;
