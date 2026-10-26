/**
 * useCeremonyScriptBuilder hook
 */
import { useCallback, useEffect, useMemo } from 'react';
import useCeremonyScriptBuilderStore from '../store';
import { filterCeremonyScriptBuilderItems, sortCeremonyScriptBuilderItems, calculateCeremonyScriptBuilderProgress } from '../utils/helpers';

export function useCeremonyScriptBuilder() {
  const items = useCeremonyScriptBuilderStore((s) => s.items);
  const loading = useCeremonyScriptBuilderStore((s) => s.loading);
  const error = useCeremonyScriptBuilderStore((s) => s.error);
  const filters = useCeremonyScriptBuilderStore((s) => s.filters);
  const stats = useCeremonyScriptBuilderStore((s) => s.stats);
  const selectedId = useCeremonyScriptBuilderStore((s) => s.selectedId);
  const fetchItems = useCeremonyScriptBuilderStore((s) => s.fetchItems);
  const addItem = useCeremonyScriptBuilderStore((s) => s.addItem);
  const updateItem = useCeremonyScriptBuilderStore((s) => s.updateItem);
  const deleteItem = useCeremonyScriptBuilderStore((s) => s.deleteItem);
  const setFilters = useCeremonyScriptBuilderStore((s) => s.setFilters);
  const selectItem = useCeremonyScriptBuilderStore((s) => s.selectItem);
  const clearSelection = useCeremonyScriptBuilderStore((s) => s.clearSelection);
  const clearError = useCeremonyScriptBuilderStore((s) => s.clearError);
  const getSelected = useCeremonyScriptBuilderStore((s) => s.getSelected);

  useEffect(() => { fetchItems().catch(() => {}); }, []);

  const filteredItems = useMemo(() => {
    const filtered = filterCeremonyScriptBuilderItems(items, filters);
    return sortCeremonyScriptBuilderItems(filtered, filters.sortBy, filters.sortOrder);
  }, [items, filters]);

  const progress = useMemo(() => calculateCeremonyScriptBuilderProgress(items), [items]);
  const selected = useMemo(() => getSelected(), [items, selectedId]);
  const refresh = useCallback(() => fetchItems(), [fetchItems]);

  return { items, filteredItems, loading, error, filters, stats, selectedId, selected, progress, fetchItems, addItem, updateItem, deleteItem, setFilters, selectItem, clearSelection, clearError, refresh };
}
export default useCeremonyScriptBuilder;
