/**
 * useCakeDesigner hook
 */
import { useCallback, useEffect, useMemo } from 'react';
import useCakeDesignerStore from '../store';
import { filterCakeDesignerItems, sortCakeDesignerItems, calculateCakeDesignerProgress } from '../utils/helpers';

export function useCakeDesigner() {
  const items = useCakeDesignerStore((s) => s.items);
  const loading = useCakeDesignerStore((s) => s.loading);
  const error = useCakeDesignerStore((s) => s.error);
  const filters = useCakeDesignerStore((s) => s.filters);
  const stats = useCakeDesignerStore((s) => s.stats);
  const selectedId = useCakeDesignerStore((s) => s.selectedId);
  const fetchItems = useCakeDesignerStore((s) => s.fetchItems);
  const addItem = useCakeDesignerStore((s) => s.addItem);
  const updateItem = useCakeDesignerStore((s) => s.updateItem);
  const deleteItem = useCakeDesignerStore((s) => s.deleteItem);
  const setFilters = useCakeDesignerStore((s) => s.setFilters);
  const selectItem = useCakeDesignerStore((s) => s.selectItem);
  const clearSelection = useCakeDesignerStore((s) => s.clearSelection);
  const clearError = useCakeDesignerStore((s) => s.clearError);
  const getSelected = useCakeDesignerStore((s) => s.getSelected);

  useEffect(() => { fetchItems().catch(() => {}); }, []);

  const filteredItems = useMemo(() => {
    const filtered = filterCakeDesignerItems(items, filters);
    return sortCakeDesignerItems(filtered, filters.sortBy, filters.sortOrder);
  }, [items, filters]);

  const progress = useMemo(() => calculateCakeDesignerProgress(items), [items]);
  const selected = useMemo(() => getSelected(), [items, selectedId]);
  const refresh = useCallback(() => fetchItems(), [fetchItems]);

  return { items, filteredItems, loading, error, filters, stats, selectedId, selected, progress, fetchItems, addItem, updateItem, deleteItem, setFilters, selectItem, clearSelection, clearError, refresh };
}
export default useCakeDesigner;
