/**
 * useDanceFloorCoordinatorList hook
 */
import { useCallback, useState } from 'react';
import useDanceFloorCoordinatorStore from '../store';

export function useDanceFloorCoordinatorList() {
  const items = useDanceFloorCoordinatorStore((s) => s.items);
  const loading = useDanceFloorCoordinatorStore((s) => s.loading);
  const filters = useDanceFloorCoordinatorStore((s) => s.filters);
  const setFilters = useDanceFloorCoordinatorStore((s) => s.setFilters);
  const deleteItem = useDanceFloorCoordinatorStore((s) => s.deleteItem);
  const bulkUpdate = useDanceFloorCoordinatorStore((s) => s.bulkUpdate);
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
export default useDanceFloorCoordinatorList;
