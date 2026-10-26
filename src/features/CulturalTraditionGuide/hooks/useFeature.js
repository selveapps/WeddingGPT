/**
 * useCulturalTraditionGuide hook
 */
import { useCallback, useEffect, useMemo } from 'react';
import useCulturalTraditionGuideStore from '../store';
import { filterCulturalTraditionGuideItems, sortCulturalTraditionGuideItems, calculateCulturalTraditionGuideProgress } from '../utils/helpers';

export function useCulturalTraditionGuide() {
  const items = useCulturalTraditionGuideStore((s) => s.items);
  const loading = useCulturalTraditionGuideStore((s) => s.loading);
  const error = useCulturalTraditionGuideStore((s) => s.error);
  const filters = useCulturalTraditionGuideStore((s) => s.filters);
  const stats = useCulturalTraditionGuideStore((s) => s.stats);
  const selectedId = useCulturalTraditionGuideStore((s) => s.selectedId);
  const fetchItems = useCulturalTraditionGuideStore((s) => s.fetchItems);
  const addItem = useCulturalTraditionGuideStore((s) => s.addItem);
  const updateItem = useCulturalTraditionGuideStore((s) => s.updateItem);
  const deleteItem = useCulturalTraditionGuideStore((s) => s.deleteItem);
  const setFilters = useCulturalTraditionGuideStore((s) => s.setFilters);
  const selectItem = useCulturalTraditionGuideStore((s) => s.selectItem);
  const clearSelection = useCulturalTraditionGuideStore((s) => s.clearSelection);
  const clearError = useCulturalTraditionGuideStore((s) => s.clearError);
  const getSelected = useCulturalTraditionGuideStore((s) => s.getSelected);

  useEffect(() => { fetchItems().catch(() => {}); }, []);

  const filteredItems = useMemo(() => {
    const filtered = filterCulturalTraditionGuideItems(items, filters);
    return sortCulturalTraditionGuideItems(filtered, filters.sortBy, filters.sortOrder);
  }, [items, filters]);

  const progress = useMemo(() => calculateCulturalTraditionGuideProgress(items), [items]);
  const selected = useMemo(() => getSelected(), [items, selectedId]);
  const refresh = useCallback(() => fetchItems(), [fetchItems]);

  return { items, filteredItems, loading, error, filters, stats, selectedId, selected, progress, fetchItems, addItem, updateItem, deleteItem, setFilters, selectItem, clearSelection, clearError, refresh };
}
export default useCulturalTraditionGuide;
