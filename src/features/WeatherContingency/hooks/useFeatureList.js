/**
 * useWeatherContingencyList hook
 */
import { useCallback, useState } from 'react';
import useWeatherContingencyStore from '../store';

export function useWeatherContingencyList() {
  const items = useWeatherContingencyStore((s) => s.items);
  const loading = useWeatherContingencyStore((s) => s.loading);
  const filters = useWeatherContingencyStore((s) => s.filters);
  const setFilters = useWeatherContingencyStore((s) => s.setFilters);
  const deleteItem = useWeatherContingencyStore((s) => s.deleteItem);
  const bulkUpdate = useWeatherContingencyStore((s) => s.bulkUpdate);
  const [selectedIds, setSelectedIds] = useState([]);
  const [multiSelect, setMultiSelect] = useState(false);

  const toggleSelect = useCallback((id) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]), []);
  const selectAll = useCallback(() => setSelectedIds(items.map((i) => i.id)), [items]);
  const clearSelection = useCallback(() => setSelectedIds([]), []);
  const handleBulkStatus = useCallback(async (status) => { if (!selectedIds.length) return; await bulkUpdate(selectedIds, { status }); clearSelection(); }, [selectedIds, bulkUpdate, clearSelection]);
  const handleBulkDelete = useCallback(async () => { for (const id of selectedIds) await deleteItem(id); clearSelection(); }, [selectedIds, deleteItem, clearSelection]);
  const isSelected = useCallback((id) => selectedIds.includes(id), [selectedIds]);

  return { items, loading, filters, setFilters, selectedIds, multiSelect, setMultiSelect, toggleSelect, selectAll, clearSelection, handleBulkStatus, handleBulkDelete, isSelected, selectedCount: selectedIds.length };
}
export default useWeatherContingencyList;
