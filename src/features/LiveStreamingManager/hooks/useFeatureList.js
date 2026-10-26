/**
 * useLiveStreamingManagerList hook
 */
import { useCallback, useState } from 'react';
import useLiveStreamingManagerStore from '../store';

export function useLiveStreamingManagerList() {
  const items = useLiveStreamingManagerStore((s) => s.items);
  const loading = useLiveStreamingManagerStore((s) => s.loading);
  const filters = useLiveStreamingManagerStore((s) => s.filters);
  const setFilters = useLiveStreamingManagerStore((s) => s.setFilters);
  const deleteItem = useLiveStreamingManagerStore((s) => s.deleteItem);
  const bulkUpdate = useLiveStreamingManagerStore((s) => s.bulkUpdate);
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
export default useLiveStreamingManagerList;
