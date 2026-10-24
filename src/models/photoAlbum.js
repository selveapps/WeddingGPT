/**
 * Photo Album & Memories model layer.
 *
 * Entities for wedding photo management: albums, photos, tags, people faces
 * (mock), sharing links, and memory timelines. Designed to be offline-first
 * and syncable via the existing sync engine.
 */

import { createEntity, touchEntity } from './base';

// --- Enums -----------------------------------------------------------------

export const AlbumVisibility = {
  PRIVATE: 'private',
  COUPLE: 'couple',
  VENDORS: 'vendors',
  GUESTS: 'guests',
  PUBLIC: 'public',
};

export const AlbumVisibilityMeta = {
  [AlbumVisibility.PRIVATE]: { label: 'Only me', tone: 'neutral' },
  [AlbumVisibility.COUPLE]: { label: 'Couple only', tone: 'info' },
  [AlbumVisibility.VENDORS]: { label: 'Couple + Vendors', tone: 'warning' },
  [AlbumVisibility.GUESTS]: { label: 'Guests (view)', tone: 'success' },
  [AlbumVisibility.PUBLIC]: { label: 'Public link', tone: 'danger' },
};

export const PhotoStatus = {
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  READY: 'ready',
  FAILED: 'failed',
  ARCHIVED: 'archived',
};

export const PhotoStatusMeta = {
  [PhotoStatus.UPLOADING]: { label: 'Uploading…', tone: 'info' },
  [PhotoStatus.PROCESSING]: { label: 'Processing', tone: 'warning' },
  [PhotoStatus.READY]: { label: 'Ready', tone: 'success' },
  [PhotoStatus.FAILED]: { label: 'Failed', tone: 'danger' },
  [PhotoStatus.ARCHIVED]: { label: 'Archived', tone: 'neutral' },
};

export const MemoryType = {
  ENGAGEMENT: 'engagement',
  PLANNING: 'planning',
  CEREMONY: 'ceremony',
  RECEPTION: 'reception',
  HONEYMOON: 'honeymoon',
  AFTER: 'after',
  CUSTOM: 'custom',
};

export const MemoryTypeMeta = {
  [MemoryType.ENGAGEMENT]: { label: 'Engagement', emoji: '💍' },
  [MemoryType.PLANNING]: { label: 'Planning Journey', emoji: '📋' },
  [MemoryType.CEREMONY]: { label: 'Ceremony', emoji: '⛪' },
  [MemoryType.RECEPTION]: { label: 'Reception', emoji: '🎉' },
  [MemoryType.HONEYMOON]: { label: 'Honeymoon', emoji: '✈️' },
  [MemoryType.AFTER]: { label: 'After the Wedding', emoji: '🏡' },
  [MemoryType.CUSTOM]: { label: 'Custom', emoji: '✨' },
};

// --- Factories -------------------------------------------------------------

/**
 * Create a photo album.
 * @param {object} partial
 * @returns {object}
 */
export function createAlbum(partial = {}) {
  return createEntity({
    weddingId: null,
    title: 'Untitled Album',
    description: '',
    coverPhotoId: null,
    visibility: AlbumVisibility.COUPLE,
    isPinned: false,
    photoCount: 0,
    tags: [],
    sortOrder: 0,
    ...partial,
  });
}

/**
 * Create a photo record. Actual binary lives in file storage / cloud;
 * this is the metadata.
 */
export function createPhoto(partial = {}) {
  return createEntity({
    weddingId: null,
    albumId: null,
    uri: null, // local or remote URI
    thumbnailUri: null,
    width: 0,
    height: 0,
    fileSize: 0,
    mimeType: 'image/jpeg',
    status: PhotoStatus.READY,
    caption: '',
    takenAt: null,
    locationName: '',
    peopleTags: [], // array of { guestId?, name, confidence }
    tags: [],
    isFavorite: false,
    isHero: false,
    orderInAlbum: 0,
    exif: null,
    ...partial,
  });
}

/**
 * A curated "memory" moment that can group photos + notes + date.
 */
export function createMemory(partial = {}) {
  return createEntity({
    weddingId: null,
    type: MemoryType.CUSTOM,
    title: '',
    description: '',
    date: null,
    photoIds: [],
    note: '',
    isHighlighted: false,
    ...partial,
  });
}

/**
 * Share link for an album (read-only or comment-enabled).
 */
export function createAlbumShare(partial = {}) {
  return createEntity({
    albumId: null,
    weddingId: null,
    token: null,
    expiresAt: null,
    allowComments: false,
    allowDownload: false,
    viewCount: 0,
    ...partial,
  });
}

// --- Helpers ---------------------------------------------------------------

export function albumCoverPhoto(album, photosById) {
  if (!album?.coverPhotoId) return null;
  return photosById?.[album.coverPhotoId] ?? null;
}

export function photosForAlbum(albumId, photosCollection) {
  if (!albumId || !photosCollection) return [];
  const list = Array.isArray(photosCollection)
    ? photosCollection
    : Object.values(photosCollection.byId || {});
  return list
    .filter((p) => p.albumId === albumId && p.status !== PhotoStatus.ARCHIVED)
    .sort((a, b) => (a.orderInAlbum ?? 0) - (b.orderInAlbum ?? 0));
}

export function favoritePhotos(photosCollection, limit = 20) {
  const list = Array.isArray(photosCollection)
    ? photosCollection
    : Object.values(photosCollection.byId || {});
  return list
    .filter((p) => p.isFavorite && p.status === PhotoStatus.READY)
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .slice(0, limit);
}

export function memoriesTimeline(memoriesCollection) {
  const list = Array.isArray(memoriesCollection)
    ? memoriesCollection
    : Object.values(memoriesCollection.byId || {});
  return list
    .slice()
    .sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return da - db;
    });
}

export function suggestAlbumTitle(type, coupleNames = '') {
  const base = MemoryTypeMeta[type]?.label || 'Album';
  if (coupleNames) return `${coupleNames} – ${base}`;
  return base;
}

/**
 * Derive simple stats for dashboard widgets.
 */
export function deriveAlbumStats(albums, photos) {
  const albumList = Array.isArray(albums) ? albums : Object.values(albums?.byId || {});
  const photoList = Array.isArray(photos) ? photos : Object.values(photos?.byId || {});
  const ready = photoList.filter((p) => p.status === PhotoStatus.READY);
  const favorites = ready.filter((p) => p.isFavorite);
  return {
    albumCount: albumList.length,
    photoCount: ready.length,
    favoriteCount: favorites.length,
    totalBytes: ready.reduce((sum, p) => sum + (p.fileSize || 0), 0),
    lastAddedAt: ready.reduce((max, p) => Math.max(max, p.createdAt || 0), 0),
  };
}
