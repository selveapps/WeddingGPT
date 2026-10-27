/** useOfficiantScriptEditor */
import { useCallback, useEffect, useMemo } from 'react';
import useStore from '../store';
import { filterItems, progress } from '../helpers';
export function useOfficiantScriptEditor() {
  const items = useStore((s) => s.items); const loading = useStore((s) => s.loading); const error = useStore((s) => s.error);
  const filters = useStore((s) => s.filters); const stats = useStore((s) => s.stats); const selectedId = useStore((s) => s.selectedId);
  const fetchItems = useStore((s) => s.fetchItems); const addItem = useStore((s) => s.addItem); const updateItem = useStore((s) => s.updateItem);
  const deleteItem = useStore((s) => s.deleteItem); const setFilters = useStore((s) => s.setFilters); const selectItem = useStore((s) => s.selectItem);
  const clearSelection = useStore((s) => s.clearSelection); const getSelected = useStore((s) => s.getSelected);
  useEffect(() => { fetchItems().catch(() => {}); }, []);
  const filteredItems = useMemo(() => filterItems(items, filters), [items, filters]);
  const pct = useMemo(() => progress(items), [items]);
  const selected = useMemo(() => getSelected(), [items, selectedId]);
  const refresh = useCallback(() => fetchItems(), [fetchItems]);
  return { items, filteredItems, loading, error, filters, stats, selectedId, selected, progress: pct, fetchItems, addItem, updateItem, deleteItem, setFilters, selectItem, clearSelection, refresh };
}
export default useOfficiantScriptEditor;
