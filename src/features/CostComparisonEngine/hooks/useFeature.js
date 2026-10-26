/**
 * useCostComparisonEngine hook
 */
import { useCallback, useEffect, useMemo } from 'react';
import useCostComparisonEngineStore from '../store';
import { filterCostComparisonEngineItems, sortCostComparisonEngineItems, calculateCostComparisonEngineProgress } from '../utils/helpers';

export function useCostComparisonEngine() {
  const items = useCostComparisonEngineStore((s) => s.items);
  const loading = useCostComparisonEngineStore((s) => s.loading);
  const error = useCostComparisonEngineStore((s) => s.error);
  const filters = useCostComparisonEngineStore((s) => s.filters);
  const stats = useCostComparisonEngineStore((s) => s.stats);
  const selectedId = useCostComparisonEngineStore((s) => s.selectedId);
  const fetchItems = useCostComparisonEngineStore((s) => s.fetchItems);
  const addItem = useCostComparisonEngineStore((s) => s.addItem);
  const updateItem = useCostComparisonEngineStore((s) => s.updateItem);
  const deleteItem = useCostComparisonEngineStore((s) => s.deleteItem);
  const setFilters = useCostComparisonEngineStore((s) => s.setFilters);
  const selectItem = useCostComparisonEngineStore((s) => s.selectItem);
  const clearSelection = useCostComparisonEngineStore((s) => s.clearSelection);
  const clearError = useCostComparisonEngineStore((s) => s.clearError);
  const getSelected = useCostComparisonEngineStore((s) => s.getSelected);

  useEffect(() => { fetchItems().catch(() => {}); }, []);

  const filteredItems = useMemo(() => {
    const filtered = filterCostComparisonEngineItems(items, filters);
    return sortCostComparisonEngineItems(filtered, filters.sortBy, filters.sortOrder);
  }, [items, filters]);

  const progress = useMemo(() => calculateCostComparisonEngineProgress(items), [items]);
  const selected = useMemo(() => getSelected(), [items, selectedId]);
  const refresh = useCallback(() => fetchItems(), [fetchItems]);

  return { items, filteredItems, loading, error, filters, stats, selectedId, selected, progress, fetchItems, addItem, updateItem, deleteItem, setFilters, selectItem, clearSelection, clearError, refresh };
}
export default useCostComparisonEngine;
