/**
 * usePhotoAlbumCollaborator hook
 */
import { useCallback, useEffect, useMemo } from 'react';
import usePhotoAlbumCollaboratorStore from '../store';
import { filterPhotoAlbumCollaboratorItems, sortPhotoAlbumCollaboratorItems, calculatePhotoAlbumCollaboratorProgress } from '../utils/helpers';

export function usePhotoAlbumCollaborator() {
  const items = usePhotoAlbumCollaboratorStore((s) => s.items);
  const loading = usePhotoAlbumCollaboratorStore((s) => s.loading);
  const error = usePhotoAlbumCollaboratorStore((s) => s.error);
  const filters = usePhotoAlbumCollaboratorStore((s) => s.filters);
  const stats = usePhotoAlbumCollaboratorStore((s) => s.stats);
  const selectedId = usePhotoAlbumCollaboratorStore((s) => s.selectedId);
  const fetchItems = usePhotoAlbumCollaboratorStore((s) => s.fetchItems);
  const addItem = usePhotoAlbumCollaboratorStore((s) => s.addItem);
  const updateItem = usePhotoAlbumCollaboratorStore((s) => s.updateItem);
  const deleteItem = usePhotoAlbumCollaboratorStore((s) => s.deleteItem);
  const setFilters = usePhotoAlbumCollaboratorStore((s) => s.setFilters);
  const selectItem = usePhotoAlbumCollaboratorStore((s) => s.selectItem);
  const clearSelection = usePhotoAlbumCollaboratorStore((s) => s.clearSelection);
  const clearError = usePhotoAlbumCollaboratorStore((s) => s.clearError);
  const getSelected = usePhotoAlbumCollaboratorStore((s) => s.getSelected);

  useEffect(() => { fetchItems().catch(() => {}); }, []);

  const filteredItems = useMemo(() => {
    const filtered = filterPhotoAlbumCollaboratorItems(items, filters);
    return sortPhotoAlbumCollaboratorItems(filtered, filters.sortBy, filters.sortOrder);
  }, [items, filters]);

  const progress = useMemo(() => calculatePhotoAlbumCollaboratorProgress(items), [items]);
  const selected = useMemo(() => getSelected(), [items, selectedId]);
  const refresh = useCallback(() => fetchItems(), [fetchItems]);

  return { items, filteredItems, loading, error, filters, stats, selectedId, selected, progress, fetchItems, addItem, updateItem, deleteItem, setFilters, selectItem, clearSelection, clearError, refresh };
}
export default usePhotoAlbumCollaborator;
