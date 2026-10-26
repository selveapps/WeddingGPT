/**
 * useLegalDocuments hook
 */
import { useCallback, useEffect, useMemo } from 'react';
import useLegalDocumentsStore from '../store';
import { filterLegalDocumentsItems, sortLegalDocumentsItems, calculateLegalDocumentsProgress } from '../utils/helpers';

export function useLegalDocuments() {
  const items = useLegalDocumentsStore((s) => s.items);
  const loading = useLegalDocumentsStore((s) => s.loading);
  const error = useLegalDocumentsStore((s) => s.error);
  const filters = useLegalDocumentsStore((s) => s.filters);
  const stats = useLegalDocumentsStore((s) => s.stats);
  const selectedId = useLegalDocumentsStore((s) => s.selectedId);
  const fetchItems = useLegalDocumentsStore((s) => s.fetchItems);
  const addItem = useLegalDocumentsStore((s) => s.addItem);
  const updateItem = useLegalDocumentsStore((s) => s.updateItem);
  const deleteItem = useLegalDocumentsStore((s) => s.deleteItem);
  const setFilters = useLegalDocumentsStore((s) => s.setFilters);
  const selectItem = useLegalDocumentsStore((s) => s.selectItem);
  const clearSelection = useLegalDocumentsStore((s) => s.clearSelection);
  const clearError = useLegalDocumentsStore((s) => s.clearError);
  const getSelected = useLegalDocumentsStore((s) => s.getSelected);

  useEffect(() => { fetchItems().catch(() => {}); }, []);

  const filteredItems = useMemo(() => {
    const filtered = filterLegalDocumentsItems(items, filters);
    return sortLegalDocumentsItems(filtered, filters.sortBy, filters.sortOrder);
  }, [items, filters]);

  const progress = useMemo(() => calculateLegalDocumentsProgress(items), [items]);
  const selected = useMemo(() => getSelected(), [items, selectedId]);
  const refresh = useCallback(() => fetchItems(), [fetchItems]);

  return { items, filteredItems, loading, error, filters, stats, selectedId, selected, progress, fetchItems, addItem, updateItem, deleteItem, setFilters, selectItem, clearSelection, clearError, refresh };
}
export default useLegalDocuments;
