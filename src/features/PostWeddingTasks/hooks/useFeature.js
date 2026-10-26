/**
 * usePostWeddingTasks hook
 */
import { useCallback, useEffect, useMemo } from 'react';
import usePostWeddingTasksStore from '../store';
import { filterPostWeddingTasksItems, sortPostWeddingTasksItems, calculatePostWeddingTasksProgress } from '../utils/helpers';

export function usePostWeddingTasks() {
  const items = usePostWeddingTasksStore((s) => s.items);
  const loading = usePostWeddingTasksStore((s) => s.loading);
  const error = usePostWeddingTasksStore((s) => s.error);
  const filters = usePostWeddingTasksStore((s) => s.filters);
  const stats = usePostWeddingTasksStore((s) => s.stats);
  const selectedId = usePostWeddingTasksStore((s) => s.selectedId);
  const fetchItems = usePostWeddingTasksStore((s) => s.fetchItems);
  const addItem = usePostWeddingTasksStore((s) => s.addItem);
  const updateItem = usePostWeddingTasksStore((s) => s.updateItem);
  const deleteItem = usePostWeddingTasksStore((s) => s.deleteItem);
  const setFilters = usePostWeddingTasksStore((s) => s.setFilters);
  const selectItem = usePostWeddingTasksStore((s) => s.selectItem);
  const clearSelection = usePostWeddingTasksStore((s) => s.clearSelection);
  const clearError = usePostWeddingTasksStore((s) => s.clearError);
  const getSelected = usePostWeddingTasksStore((s) => s.getSelected);

  useEffect(() => { fetchItems().catch(() => {}); }, []);

  const filteredItems = useMemo(() => {
    const filtered = filterPostWeddingTasksItems(items, filters);
    return sortPostWeddingTasksItems(filtered, filters.sortBy, filters.sortOrder);
  }, [items, filters]);

  const progress = useMemo(() => calculatePostWeddingTasksProgress(items), [items]);
  const selected = useMemo(() => getSelected(), [items, selectedId]);
  const refresh = useCallback(() => fetchItems(), [fetchItems]);

  return { items, filteredItems, loading, error, filters, stats, selectedId, selected, progress, fetchItems, addItem, updateItem, deleteItem, setFilters, selectItem, clearSelection, clearError, refresh };
}
export default usePostWeddingTasks;
