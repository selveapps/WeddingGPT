/**
 * Music & Entertainment store.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '../services/storage';
import {
  createPlaylist,
  createTrack,
  createDoNotPlayEntry,
  createMusicMoment,
  buildDefaultPlaylists,
  tracksForPlaylist,
  mustPlayTracks,
  playlistDuration,
  deriveMusicStats,
  PlaylistType,
} from '../models/music';

// Local collection helpers (mirroring project style)
function emptyCol() {
  return { byId: {}, allIds: [] };
}
function upsert(col, entity) {
  const byId = { ...(col.byId || {}), [entity.id]: entity };
  const allIds = col.allIds?.includes(entity.id)
    ? col.allIds
    : [...(col.allIds || []), entity.id];
  return { byId, allIds };
}
function upsertMany(col, entities) {
  return entities.reduce((c, e) => upsert(c, e), col);
}
function removeById(col, id) {
  const byId = { ...(col.byId || {}) };
  delete byId[id];
  return { byId, allIds: (col.allIds || []).filter((x) => x !== id) };
}
function touch(entity, patch) {
  return { ...entity, ...patch, updatedAt: Date.now() };
}
function denorm(col) {
  return (col.allIds || []).map((id) => col.byId[id]).filter(Boolean);
}

const initialState = {
  playlists: emptyCol(),
  tracks: emptyCol(),
  doNotPlay: emptyCol(),
  moments: emptyCol(),
};

export const useMusicStore = create()(
  persist(
    (set, get) => ({
      ...initialState,

      initialiseDefaults(weddingId) {
        const existing = denorm(get().playlists).filter((p) => p.weddingId === weddingId);
        if (existing.length > 0) return existing;
        const defaults = buildDefaultPlaylists(weddingId);
        set((state) => ({
          playlists: upsertMany(state.playlists, defaults),
        }));
        return defaults;
      },

      createPlaylist(partial) {
        const pl = createPlaylist(partial);
        set((s) => ({ playlists: upsert(s.playlists, pl) }));
        return pl;
      },

      updatePlaylist(id, patch) {
        const cur = get().playlists.byId[id];
        if (!cur) return null;
        const next = touch(cur, patch);
        set((s) => ({ playlists: upsert(s.playlists, next) }));
        return next;
      },

      deletePlaylist(id) {
        set((s) => {
          const playlists = removeById(s.playlists, id);
          const tracks = denorm(s.tracks)
            .filter((t) => t.playlistId !== id)
            .reduce((c, t) => upsert(c, t), emptyCol());
          return { playlists, tracks };
        });
      },

      addTrack(partial) {
        const track = createTrack(partial);
        set((s) => {
          const tracks = upsert(s.tracks, track);
          let playlists = s.playlists;
          if (track.playlistId && s.playlists.byId[track.playlistId]) {
            const pl = s.playlists.byId[track.playlistId];
            const plTracks = tracksForPlaylist(track.playlistId, tracks);
            playlists = upsert(
              playlists,
              touch(pl, {
                trackCount: plTracks.length,
                totalDurationSec: playlistDuration(plTracks),
              })
            );
          }
          return { tracks, playlists };
        });
        return track;
      },

      updateTrack(id, patch) {
        const cur = get().tracks.byId[id];
        if (!cur) return null;
        const next = touch(cur, patch);
        set((s) => ({ tracks: upsert(s.tracks, next) }));
        return next;
      },

      removeTrack(id) {
        const track = get().tracks.byId[id];
        set((s) => {
          const tracks = removeById(s.tracks, id);
          let playlists = s.playlists;
          if (track?.playlistId && s.playlists.byId[track.playlistId]) {
            const pl = s.playlists.byId[track.playlistId];
            const plTracks = tracksForPlaylist(track.playlistId, tracks);
            playlists = upsert(
              playlists,
              touch(pl, {
                trackCount: plTracks.length,
                totalDurationSec: playlistDuration(plTracks),
              })
            );
          }
          return { tracks, playlists };
        });
      },

      reorderTracks(playlistId, orderedIds) {
        const updates = orderedIds
          .map((id, i) => {
            const t = get().tracks.byId[id];
            if (!t || t.playlistId !== playlistId) return null;
            return touch(t, { orderInPlaylist: i });
          })
          .filter(Boolean);
        if (!updates.length) return;
        set((s) => ({ tracks: upsertMany(s.tracks, updates) }));
      },

      addDoNotPlay(partial) {
        const entry = createDoNotPlayEntry(partial);
        set((s) => ({ doNotPlay: upsert(s.doNotPlay, entry) }));
        return entry;
      },

      removeDoNotPlay(id) {
        set((s) => ({ doNotPlay: removeById(s.doNotPlay, id) }));
      },

      addMoment(partial) {
        const m = createMusicMoment(partial);
        set((s) => ({ moments: upsert(s.moments, m) }));
        return m;
      },

      updateMoment(id, patch) {
        const cur = get().moments.byId[id];
        if (!cur) return null;
        const next = touch(cur, patch);
        set((s) => ({ moments: upsert(s.moments, next) }));
        return next;
      },

      deleteMoment(id) {
        set((s) => ({ moments: removeById(s.moments, id) }));
      },

      getPlaylistTracks(playlistId) {
        return tracksForPlaylist(playlistId, get().tracks);
      },

      getMustPlay() {
        return mustPlayTracks(get().tracks);
      },

      getStats() {
        return deriveMusicStats(get().playlists, get().tracks);
      },

      exportDjSheet(weddingId) {
        const playlists = denorm(get().playlists)
          .filter((p) => p.weddingId === weddingId)
          .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        const doNot = denorm(get().doNotPlay).filter((d) => d.weddingId === weddingId);
        const moments = denorm(get().moments).filter((m) => m.weddingId === weddingId);

        return {
          generatedAt: new Date().toISOString(),
          playlists: playlists.map((pl) => ({
            title: pl.title,
            type: pl.type,
            notesForDj: pl.notesForDj,
            tracks: tracksForPlaylist(pl.id, get().tracks).map((t) => ({
              title: t.title,
              artist: t.artist,
              durationSec: t.durationSec,
              isMustPlay: t.isMustPlay,
              notes: t.notes,
            })),
          })),
          doNotPlay: doNot.map((d) => ({ title: d.title, artist: d.artist, reason: d.reason })),
          moments: moments.map((m) => ({
            name: m.name,
            notes: m.notes,
            scheduledAt: m.scheduledAt,
          })),
        };
      },

      reset() {
        set(initialState);
      },
    }),
    {
      name: 'weddinggpt-music',
      storage: zustandStorage,
      partialize: (s) => ({
        playlists: s.playlists,
        tracks: s.tracks,
        doNotPlay: s.doNotPlay,
        moments: s.moments,
      }),
    }
  )
);
