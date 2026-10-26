/**
 * useGuestExperienceSurvey hook
 */
import { useCallback, useEffect, useMemo } from 'react';
import useGuestExperienceSurveyStore from '../store';
import { filterGuestExperienceSurveyItems, sortGuestExperienceSurveyItems, calculateGuestExperienceSurveyProgress } from '../utils/helpers';

export function useGuestExperienceSurvey() {
  const items = useGuestExperienceSurveyStore((s) => s.items);
  const loading = useGuestExperienceSurveyStore((s) => s.loading);
  const error = useGuestExperienceSurveyStore((s) => s.error);
  const filters = useGuestExperienceSurveyStore((s) => s.filters);
  const stats = useGuestExperienceSurveyStore((s) => s.stats);
  const selectedId = useGuestExperienceSurveyStore((s) => s.selectedId);
  const fetchItems = useGuestExperienceSurveyStore((s) => s.fetchItems);
  const addItem = useGuestExperienceSurveyStore((s) => s.addItem);
  const updateItem = useGuestExperienceSurveyStore((s) => s.updateItem);
  const deleteItem = useGuestExperienceSurveyStore((s) => s.deleteItem);
  const setFilters = useGuestExperienceSurveyStore((s) => s.setFilters);
  const selectItem = useGuestExperienceSurveyStore((s) => s.selectItem);
  const clearSelection = useGuestExperienceSurveyStore((s) => s.clearSelection);
  const clearError = useGuestExperienceSurveyStore((s) => s.clearError);
  const getSelected = useGuestExperienceSurveyStore((s) => s.getSelected);

  useEffect(() => { fetchItems().catch(() => {}); }, []);

  const filteredItems = useMemo(() => {
    const filtered = filterGuestExperienceSurveyItems(items, filters);
    return sortGuestExperienceSurveyItems(filtered, filters.sortBy, filters.sortOrder);
  }, [items, filters]);

  const progress = useMemo(() => calculateGuestExperienceSurveyProgress(items), [items]);
  const selected = useMemo(() => getSelected(), [items, selectedId]);
  const refresh = useCallback(() => fetchItems(), [fetchItems]);

  return { items, filteredItems, loading, error, filters, stats, selectedId, selected, progress, fetchItems, addItem, updateItem, deleteItem, setFilters, selectItem, clearSelection, clearError, refresh };
}
export default useGuestExperienceSurvey;
