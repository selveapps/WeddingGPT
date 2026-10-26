/**
 * useReceptionFlowDesigner hook
 */
import { useCallback, useEffect, useMemo } from 'react';
import useReceptionFlowDesignerStore from '../store';
import { filterReceptionFlowDesignerItems, sortReceptionFlowDesignerItems, calculateReceptionFlowDesignerProgress } from '../utils/helpers';

export function useReceptionFlowDesigner() {
  const items = useReceptionFlowDesignerStore((s) => s.items);
  const loading = useReceptionFlowDesignerStore((s) => s.loading);
  const error = useReceptionFlowDesignerStore((s) => s.error);
  const filters = useReceptionFlowDesignerStore((s) => s.filters);
  const stats = useReceptionFlowDesignerStore((s) => s.stats);
  const selectedId = useReceptionFlowDesignerStore((s) => s.selectedId);
  const fetchItems = useReceptionFlowDesignerStore((s) => s.fetchItems);
  const addItem = useReceptionFlowDesignerStore((s) => s.addItem);
  const updateItem = useReceptionFlowDesignerStore((s) => s.updateItem);
  const deleteItem = useReceptionFlowDesignerStore((s) => s.deleteItem);
  const setFilters = useReceptionFlowDesignerStore((s) => s.setFilters);
  const selectItem = useReceptionFlowDesignerStore((s) => s.selectItem);
  const clearSelection = useReceptionFlowDesignerStore((s) => s.clearSelection);
  const clearError = useReceptionFlowDesignerStore((s) => s.clearError);
  const getSelected = useReceptionFlowDesignerStore((s) => s.getSelected);

  useEffect(() => { fetchItems().catch(() => {}); }, []);

  const filteredItems = useMemo(() => {
    const filtered = filterReceptionFlowDesignerItems(items, filters);
    return sortReceptionFlowDesignerItems(filtered, filters.sortBy, filters.sortOrder);
  }, [items, filters]);

  const progress = useMemo(() => calculateReceptionFlowDesignerProgress(items), [items]);
  const selected = useMemo(() => getSelected(), [items, selectedId]);
  const refresh = useCallback(() => fetchItems(), [fetchItems]);

  return { items, filteredItems, loading, error, filters, stats, selectedId, selected, progress, fetchItems, addItem, updateItem, deleteItem, setFilters, selectItem, clearSelection, clearError, refresh };
}
export default useReceptionFlowDesigner;
