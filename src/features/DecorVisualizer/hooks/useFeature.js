/**
 * useDecorVisualizer hook
 */
import { useCallback, useEffect, useMemo } from 'react';
import useDecorVisualizerStore from '../store';
import { filterDecorVisualizerItems, sortDecorVisualizerItems, calculateDecorVisualizerProgress } from '../utils/helpers';

export function useDecorVisualizer() {
  const items = useDecorVisualizerStore((s) => s.items);
  const loading = useDecorVisualizerStore((s) => s.loading);
  const error = useDecorVisualizerStore((s) => s.error);
  const filters = useDecorVisualizerStore((s) => s.filters);
  const stats = useDecorVisualizerStore((s) => s.stats);
  const selectedId = useDecorVisualizerStore((s) => s.selectedId);
  const fetchItems = useDecorVisualizerStore((s) => s.fetchItems);
  const addItem = useDecorVisualizerStore((s) => s.addItem);
  const updateItem = useDecorVisualizerStore((s) => s.updateItem);
  const deleteItem = useDecorVisualizerStore((s) => s.deleteItem);
  const setFilters = useDecorVisualizerStore((s) => s.setFilters);
  const selectItem = useDecorVisualizerStore((s) => s.selectItem);
  const clearSelection = useDecorVisualizerStore((s) => s.clearSelection);
  const clearError = useDecorVisualizerStore((s) => s.clearError);
  const getSelected = useDecorVisualizerStore((s) => s.getSelected);

  useEffect(() => { fetchItems().catch(() => {}); }, []);

  const filteredItems = useMemo(() => {
    const filtered = filterDecorVisualizerItems(items, filters);
    return sortDecorVisualizerItems(filtered, filters.sortBy, filters.sortOrder);
  }, [items, filters]);

  const progress = useMemo(() => calculateDecorVisualizerProgress(items), [items]);
  const selected = useMemo(() => getSelected(), [items, selectedId]);
  const refresh = useCallback(() => fetchItems(), [fetchItems]);

  return { items, filteredItems, loading, error, filters, stats, selectedId, selected, progress, fetchItems, addItem, updateItem, deleteItem, setFilters, selectItem, clearSelection, clearError, refresh };
}
export default useDecorVisualizer;
