/**
 * useDecorVisualizerList hook
 */
import { useCallback, useState } from 'react';
import useDecorVisualizerStore from '../store';

export function useDecorVisualizerList() {
  const items = useDecorVisualizerStore((s) => s.items);
  const loading = useDecorVisualizerStore((s) => s.loading);
  const filters = useDecorVisualizerStore((s) => s.filters);
  const setFilters = useDecorVisualizerStore((s) => s.setFilters);
  const deleteItem = useDecorVisualizerStore((s) => s.deleteItem);
  const bulkUpdate = useDecorVisualizerStore((s) => s.bulkUpdate);
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
export default useDecorVisualizerList;
