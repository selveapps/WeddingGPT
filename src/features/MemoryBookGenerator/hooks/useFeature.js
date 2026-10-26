/**
 * useMemoryBookGenerator hook
 */
import { useCallback, useEffect, useMemo } from 'react';
import useMemoryBookGeneratorStore from '../store';
import { filterMemoryBookGeneratorItems, sortMemoryBookGeneratorItems, calculateMemoryBookGeneratorProgress } from '../utils/helpers';

export function useMemoryBookGenerator() {
  const items = useMemoryBookGeneratorStore((s) => s.items);
  const loading = useMemoryBookGeneratorStore((s) => s.loading);
  const error = useMemoryBookGeneratorStore((s) => s.error);
  const filters = useMemoryBookGeneratorStore((s) => s.filters);
  const stats = useMemoryBookGeneratorStore((s) => s.stats);
  const selectedId = useMemoryBookGeneratorStore((s) => s.selectedId);
  const fetchItems = useMemoryBookGeneratorStore((s) => s.fetchItems);
  const addItem = useMemoryBookGeneratorStore((s) => s.addItem);
  const updateItem = useMemoryBookGeneratorStore((s) => s.updateItem);
  const deleteItem = useMemoryBookGeneratorStore((s) => s.deleteItem);
  const setFilters = useMemoryBookGeneratorStore((s) => s.setFilters);
  const selectItem = useMemoryBookGeneratorStore((s) => s.selectItem);
  const clearSelection = useMemoryBookGeneratorStore((s) => s.clearSelection);
  const clearError = useMemoryBookGeneratorStore((s) => s.clearError);
  const getSelected = useMemoryBookGeneratorStore((s) => s.getSelected);

  useEffect(() => { fetchItems().catch(() => {}); }, [fetchItems]);

  const filteredItems = useMemo(() => {
    const filtered = filterMemoryBookGeneratorItems(items, filters);
    return sortMemoryBookGeneratorItems(filtered, filters.sortBy, filters.sortOrder);
  }, [items, filters]);

  const progress = useMemo(() => calculateMemoryBookGeneratorProgress(items), [items]);
  const selected = getSelected();
  const refresh = useCallback(() => fetchItems(), [fetchItems]);

  return { items, filteredItems, loading, error, filters, stats, selectedId, selected, progress, fetchItems, addItem, updateItem, deleteItem, setFilters, selectItem, clearSelection, clearError, refresh };
}
export default useMemoryBookGenerator;
