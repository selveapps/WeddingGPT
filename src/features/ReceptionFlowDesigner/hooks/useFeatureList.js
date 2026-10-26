/**
 * useReceptionFlowDesignerList hook
 */
import { useCallback, useState } from 'react';
import useReceptionFlowDesignerStore from '../store';

export function useReceptionFlowDesignerList() {
  const items = useReceptionFlowDesignerStore((s) => s.items);
  const loading = useReceptionFlowDesignerStore((s) => s.loading);
  const filters = useReceptionFlowDesignerStore((s) => s.filters);
  const setFilters = useReceptionFlowDesignerStore((s) => s.setFilters);
  const deleteItem = useReceptionFlowDesignerStore((s) => s.deleteItem);
  const bulkUpdate = useReceptionFlowDesignerStore((s) => s.bulkUpdate);
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
export default useReceptionFlowDesignerList;
