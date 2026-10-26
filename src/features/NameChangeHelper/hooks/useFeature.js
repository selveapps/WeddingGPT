/**
 * useNameChangeHelper hook
 */
import { useCallback, useEffect, useMemo } from 'react';
import useNameChangeHelperStore from '../store';
import { filterNameChangeHelperItems, sortNameChangeHelperItems, calculateNameChangeHelperProgress } from '../utils/helpers';

export function useNameChangeHelper() {
  const items = useNameChangeHelperStore((s) => s.items);
  const loading = useNameChangeHelperStore((s) => s.loading);
  const error = useNameChangeHelperStore((s) => s.error);
  const filters = useNameChangeHelperStore((s) => s.filters);
  const stats = useNameChangeHelperStore((s) => s.stats);
  const selectedId = useNameChangeHelperStore((s) => s.selectedId);
  const fetchItems = useNameChangeHelperStore((s) => s.fetchItems);
  const addItem = useNameChangeHelperStore((s) => s.addItem);
  const updateItem = useNameChangeHelperStore((s) => s.updateItem);
  const deleteItem = useNameChangeHelperStore((s) => s.deleteItem);
  const setFilters = useNameChangeHelperStore((s) => s.setFilters);
  const selectItem = useNameChangeHelperStore((s) => s.selectItem);
  const clearSelection = useNameChangeHelperStore((s) => s.clearSelection);
  const clearError = useNameChangeHelperStore((s) => s.clearError);
  const getSelected = useNameChangeHelperStore((s) => s.getSelected);

  useEffect(() => { fetchItems().catch(() => {}); }, []);

  const filteredItems = useMemo(() => {
    const filtered = filterNameChangeHelperItems(items, filters);
    return sortNameChangeHelperItems(filtered, filters.sortBy, filters.sortOrder);
  }, [items, filters]);

  const progress = useMemo(() => calculateNameChangeHelperProgress(items), [items]);
  const selected = useMemo(() => getSelected(), [items, selectedId]);
  const refresh = useCallback(() => fetchItems(), [fetchItems]);

  return { items, filteredItems, loading, error, filters, stats, selectedId, selected, progress, fetchItems, addItem, updateItem, deleteItem, setFilters, selectItem, clearSelection, clearError, refresh };
}
export default useNameChangeHelper;
