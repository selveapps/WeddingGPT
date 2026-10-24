/**
 * Photo Album store – albums, photos, memories, shares.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandStorage } from '../services/storage';
import { analytics, AnalyticsEvents } from '../services/analytics';
import {
  createAlbum,
  createPhoto,
  createMemory,
  createAlbumShare,
  photosForAlbum,
  favoritePhotos,
  memoriesTimeline,
  deriveAlbumStats,
  AlbumVisibility,
  PhotoStatus,
  emptyCollection,
  upsert,
  upsertMany,
  removeById,
  touchEntity,
  denormalise,
} from '../models';

// Note: emptyCollection, upsert etc. are re-exported or imported from models/base via models/index.
// For this extension pack we assume the main models barrel will be extended.

const initialState = {
  albums: { byId: {}, allIds: [] },
  photos: { byId: {}, allIds: [] },
  memories: { byId: {}, allIds: [] },
  shares: { byId: {}, allIds: [] },
};

function ensureCollection(c) {
  if (!c || !c.byId) return { byId: {}, allIds: [] };
  return c;
}

export const usePhotoAlbumStore = create()(
  persist(
    (set, get) => ({
      ...initialState,

      // --- Albums -----------------------------------------------------------
      createAlbum(partial = {}) {
        const album = createAlbum(partial);
        set((state) => ({
          albums: upsert(ensureCollection(state.albums), album),
        }));
        analytics.track?.('photo_album_created', { albumId: album.id });
        return album;
      },

      updateAlbum(id, patch) {
        const current = get().albums.byId?.[id];
        if (!current) return null;
        const next = touchEntity(current, patch);
        set((state) => ({
          albums: upsert(ensureCollection(state.albums), next),
        }));
        return next;
      },

      deleteAlbum(id) {
        set((state) => {
          const albums = removeById(ensureCollection(state.albums), id);
          // Optionally orphan photos or cascade – for now keep photos, clear albumId
          const photos = { ...ensureCollection(state.photos) };
          const updatedPhotos = denormalise(photos).map((p) =>
            p.albumId === id ? touchEntity(p, { albumId: null }) : p
          );
          return {
            albums,
            photos: upsertMany({ byId: {}, allIds: [] }, updatedPhotos),
          };
        });
      },

      setCoverPhoto(albumId, photoId) {
        return get().updateAlbum(albumId, { coverPhotoId: photoId });
      },

      // --- Photos ------------------------------------------------------------
      addPhoto(partial = {}) {
        const photo = createPhoto({
          status: PhotoStatus.READY,
          ...partial,
        });
        set((state) => {
          const photos = upsert(ensureCollection(state.photos), photo);
          let albums = ensureCollection(state.albums);
          if (photo.albumId && albums.byId[photo.albumId]) {
            const album = albums.byId[photo.albumId];
            const nextAlbum = touchEntity(album, {
              photoCount: (album.photoCount || 0) + 1,
            });
            albums = upsert(albums, nextAlbum);
          }
          return { photos, albums };
        });
        return photo;
      },

      updatePhoto(id, patch) {
        const current = get().photos.byId?.[id];
        if (!current) return null;
        const next = touchEntity(current, patch);
        set((state) => ({
          photos: upsert(ensureCollection(state.photos), next),
        }));
        return next;
      },

      toggleFavorite(id) {
        const current = get().photos.byId?.[id];
        if (!current) return null;
        return get().updatePhoto(id, { isFavorite: !current.isFavorite });
      },

      removePhoto(id) {
        const photo = get().photos.byId?.[id];
        set((state) => {
          const photos = removeById(ensureCollection(state.photos), id);
          let albums = ensureCollection(state.albums);
          if (photo?.albumId && albums.byId[photo.albumId]) {
            const album = albums.byId[photo.albumId];
            albums = upsert(
              albums,
              touchEntity(album, {
                photoCount: Math.max(0, (album.photoCount || 1) - 1),
                coverPhotoId: album.coverPhotoId === id ? null : album.coverPhotoId,
              })
            );
          }
          return { photos, albums };
        });
      },

      reorderPhotosInAlbum(albumId, orderedIds) {
        const updates = orderedIds.map((id, index) => {
          const p = get().photos.byId?.[id];
          if (!p || p.albumId !== albumId) return null;
          return touchEntity(p, { orderInAlbum: index });
        }).filter(Boolean);
        if (!updates.length) return;
        set((state) => ({
          photos: upsertMany(ensureCollection(state.photos), updates),
        }));
      },

      // --- Memories ----------------------------------------------------------
      createMemory(partial = {}) {
        const memory = createMemory(partial);
        set((state) => ({
          memories: upsert(ensureCollection(state.memories), memory),
        }));
        return memory;
      },

      updateMemory(id, patch) {
        const current = get().memories.byId?.[id];
        if (!current) return null;
        const next = touchEntity(current, patch);
        set((state) => ({
          memories: upsert(ensureCollection(state.memories), next),
        }));
        return next;
      },

      deleteMemory(id) {
        set((state) => ({
          memories: removeById(ensureCollection(state.memories), id),
        }));
      },

      // --- Shares ------------------------------------------------------------
      createShare(partial = {}) {
        const token =
          partial.token ||
          `share_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
        const share = createAlbumShare({ ...partial, token });
        set((state) => ({
          shares: upsert(ensureCollection(state.shares), share),
        }));
        return share;
      },

      revokeShare(id) {
        set((state) => ({
          shares: removeById(ensureCollection(state.shares), id),
        }));
      },

      // --- Selectors (as methods for convenience) ----------------------------
      getAlbumPhotos(albumId) {
        return photosForAlbum(albumId, get().photos);
      },

      getFavorites(limit = 20) {
        return favoritePhotos(get().photos, limit);
      },

      getTimeline() {
        return memoriesTimeline(get().memories);
      },

      getStats() {
        return deriveAlbumStats(get().albums, get().photos);
      },

      // --- Bulk / seed -------------------------------------------------------
      seedDemoAlbums(weddingId) {
        if (!weddingId) return;
        const existing = denormalise(get().albums);
        if (existing.some((a) => a.weddingId === weddingId)) return;

        const engagement = createAlbum({
          weddingId,
          title: 'Engagement Session',
          description: 'Our engagement photos',
          visibility: AlbumVisibility.COUPLE,
          isPinned: true,
        });
        const planning = createAlbum({
          weddingId,
          title: 'Planning Moments',
          description: 'Behind the scenes of planning',
          visibility: AlbumVisibility.COUPLE,
        });
        const dayOf = createAlbum({
          weddingId,
          title: 'Wedding Day',
          description: 'The big day',
          visibility: AlbumVisibility.GUESTS,
          isPinned: true,
        });

        set((state) => ({
          albums: upsertMany(ensureCollection(state.albums), [engagement, planning, dayOf]),
        }));
      },

      reset() {
        set(initialState);
      },
    }),
    {
      name: 'weddinggpt-photo-album',
      storage: zustandStorage,
      partialize: (state) => ({
        albums: state.albums,
        photos: state.photos,
        memories: state.memories,
        shares: state.shares,
      }),
    }
  )
);
