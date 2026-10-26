/**
 * useWeatherContingency hook
 */
import { useCallback, useEffect, useMemo } from 'react';
import useWeatherContingencyStore from '../store';
import { filterWeatherContingencyItems, sortWeatherContingencyItems, calculateWeatherContingencyProgress } from '../utils/helpers';

export function useWeatherContingency() {
  const items = useWeatherContingencyStore((s) => s.items);
  const loading = useWeatherContingencyStore((s) => s.loading);
  const error = useWeatherContingencyStore((s) => s.error);
  const filters = useWeatherContingencyStore((s) => s.filters);
  const stats = useWeatherContingencyStore((s) => s.stats);
  const selectedId = useWeatherContingencyStore((s) => s.selectedId);
  const fetchItems = useWeatherContingencyStore((s) => s.fetchItems);
  const addItem = useWeatherContingencyStore((s) => s.addItem);
  const updateItem = useWeatherContingencyStore((s) => s.updateItem);
  const deleteItem = useWeatherContingencyStore((s) => s.deleteItem);
  const setFilters = useWeatherContingencyStore((s) => s.setFilters);
  const selectItem = useWeatherContingencyStore((s) => s.selectItem);
  const clearSelection = useWeatherContingencyStore((s) => s.clearSelection);
  const clearError = useWeatherContingencyStore((s) => s.clearError);
  const getSelected = useWeatherContingencyStore((s) => s.getSelected);

  useEffect(() => { fetchItems().catch(() => {}); }, []);

  const filteredItems = useMemo(() => {
    const filtered = filterWeatherContingencyItems(items, filters);
    return sortWeatherContingencyItems(filtered, filters.sortBy, filters.sortOrder);
  }, [items, filters]);

  const progress = useMemo(() => calculateWeatherContingencyProgress(items), [items]);
  const selected = useMemo(() => getSelected(), [items, selectedId]);
  const refresh = useCallback(() => fetchItems(), [fetchItems]);

  return { items, filteredItems, loading, error, filters, stats, selectedId, selected, progress, fetchItems, addItem, updateItem, deleteItem, setFilters, selectItem, clearSelection, clearError, refresh };
}
export default useWeatherContingency;
