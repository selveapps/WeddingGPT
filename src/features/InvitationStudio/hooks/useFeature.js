/**
 * useInvitationStudio hook
 */
import { useCallback, useEffect, useMemo } from 'react';
import useInvitationStudioStore from '../store';
import { filterInvitationStudioItems, sortInvitationStudioItems, calculateInvitationStudioProgress } from '../utils/helpers';

export function useInvitationStudio() {
  const items = useInvitationStudioStore((s) => s.items);
  const loading = useInvitationStudioStore((s) => s.loading);
  const error = useInvitationStudioStore((s) => s.error);
  const filters = useInvitationStudioStore((s) => s.filters);
  const stats = useInvitationStudioStore((s) => s.stats);
  const selectedId = useInvitationStudioStore((s) => s.selectedId);
  const fetchItems = useInvitationStudioStore((s) => s.fetchItems);
  const addItem = useInvitationStudioStore((s) => s.addItem);
  const updateItem = useInvitationStudioStore((s) => s.updateItem);
  const deleteItem = useInvitationStudioStore((s) => s.deleteItem);
  const setFilters = useInvitationStudioStore((s) => s.setFilters);
  const selectItem = useInvitationStudioStore((s) => s.selectItem);
  const clearSelection = useInvitationStudioStore((s) => s.clearSelection);
  const clearError = useInvitationStudioStore((s) => s.clearError);
  const getSelected = useInvitationStudioStore((s) => s.getSelected);

  useEffect(() => { fetchItems().catch(() => {}); }, []);

  const filteredItems = useMemo(() => {
    const filtered = filterInvitationStudioItems(items, filters);
    return sortInvitationStudioItems(filtered, filters.sortBy, filters.sortOrder);
  }, [items, filters]);

  const progress = useMemo(() => calculateInvitationStudioProgress(items), [items]);
  const selected = useMemo(() => getSelected(), [items, selectedId]);
  const refresh = useCallback(() => fetchItems(), [fetchItems]);

  return { items, filteredItems, loading, error, filters, stats, selectedId, selected, progress, fetchItems, addItem, updateItem, deleteItem, setFilters, selectItem, clearSelection, clearError, refresh };
}
export default useInvitationStudio;
