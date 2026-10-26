/**
 * useSpeechWriterAI hook
 */
import { useCallback, useEffect, useMemo } from 'react';
import useSpeechWriterAIStore from '../store';
import { filterSpeechWriterAIItems, sortSpeechWriterAIItems, calculateSpeechWriterAIProgress } from '../utils/helpers';

export function useSpeechWriterAI() {
  const items = useSpeechWriterAIStore((s) => s.items);
  const loading = useSpeechWriterAIStore((s) => s.loading);
  const error = useSpeechWriterAIStore((s) => s.error);
  const filters = useSpeechWriterAIStore((s) => s.filters);
  const stats = useSpeechWriterAIStore((s) => s.stats);
  const selectedId = useSpeechWriterAIStore((s) => s.selectedId);
  const fetchItems = useSpeechWriterAIStore((s) => s.fetchItems);
  const addItem = useSpeechWriterAIStore((s) => s.addItem);
  const updateItem = useSpeechWriterAIStore((s) => s.updateItem);
  const deleteItem = useSpeechWriterAIStore((s) => s.deleteItem);
  const setFilters = useSpeechWriterAIStore((s) => s.setFilters);
  const selectItem = useSpeechWriterAIStore((s) => s.selectItem);
  const clearSelection = useSpeechWriterAIStore((s) => s.clearSelection);
  const clearError = useSpeechWriterAIStore((s) => s.clearError);
  const getSelected = useSpeechWriterAIStore((s) => s.getSelected);

  useEffect(() => { fetchItems().catch(() => {}); }, []);

  const filteredItems = useMemo(() => {
    const filtered = filterSpeechWriterAIItems(items, filters);
    return sortSpeechWriterAIItems(filtered, filters.sortBy, filters.sortOrder);
  }, [items, filters]);

  const progress = useMemo(() => calculateSpeechWriterAIProgress(items), [items]);
  const selected = useMemo(() => getSelected(), [items, selectedId]);
  const refresh = useCallback(() => fetchItems(), [fetchItems]);

  return { items, filteredItems, loading, error, filters, stats, selectedId, selected, progress, fetchItems, addItem, updateItem, deleteItem, setFilters, selectItem, clearSelection, clearError, refresh };
}
export default useSpeechWriterAI;
