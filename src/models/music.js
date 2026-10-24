/**
 * Music & Entertainment Planner model.
 *
 * Playlists for ceremony, cocktail hour, reception, first dance, parent dances,
 * and special moments. Tracks can be local references or streaming links.
 * Includes "do not play" lists and vendor handoff notes.
 */

import { createEntity, touchEntity } from './base';

// --- Enums -----------------------------------------------------------------

export const PlaylistType = {
  CEREMONY: 'ceremony',
  PROCESSIONAL: 'processional',
  RECESSIONAL: 'recessional',
  COCKTAIL: 'cocktail',
  DINNER: 'dinner',
  DANCING: 'dancing',
  FIRST_DANCE: 'first_dance',
  PARENT_DANCE: 'parent_dance',
  CAKE_CUTTING: 'cake_cutting',
  BOUQUET: 'bouquet',
  LAST_SONG: 'last_song',
  BACKGROUND: 'background',
  CUSTOM: 'custom',
};

export const PlaylistTypeMeta = {
  [PlaylistType.CEREMONY]: { label: 'Ceremony', emoji: '🎻', order: 10 },
  [PlaylistType.PROCESSIONAL]: { label: 'Processional', emoji: '🚶', order: 20 },
  [PlaylistType.RECESSIONAL]: { label: 'Recessional', emoji: '🎉', order: 30 },
  [PlaylistType.COCKTAIL]: { label: 'Cocktail Hour', emoji: '🥂', order: 40 },
  [PlaylistType.DINNER]: { label: 'Dinner', emoji: '🍽️', order: 50 },
  [PlaylistType.DANCING]: { label: 'Dancing / Party', emoji: '💃', order: 60 },
  [PlaylistType.FIRST_DANCE]: { label: 'First Dance', emoji: '💕', order: 70 },
  [PlaylistType.PARENT_DANCE]: { label: 'Parent Dances', emoji: '👨‍👩‍👧', order: 80 },
  [PlaylistType.CAKE_CUTTING]: { label: 'Cake Cutting', emoji: '🎂', order: 90 },
  [PlaylistType.BOUQUET]: { label: 'Bouquet / Garter', emoji: '💐', order: 100 },
  [PlaylistType.LAST_SONG]: { label: 'Last Song', emoji: '🌙', order: 110 },
  [PlaylistType.BACKGROUND]: { label: 'Background', emoji: '🎵', order: 120 },
  [PlaylistType.CUSTOM]: { label: 'Custom', emoji: '✨', order: 200 },
};

export const TrackSource = {
  MANUAL: 'manual',
  SPOTIFY: 'spotify',
  APPLE_MUSIC: 'apple_music',
  YOUTUBE: 'youtube',
  LOCAL: 'local',
  OTHER: 'other',
};

export const EnergyLevel = {
  SOFT: 'soft',
  MEDIUM: 'medium',
  HIGH: 'high',
  PEAK: 'peak',
};

export const EnergyLevelMeta = {
  [EnergyLevel.SOFT]: { label: 'Soft / Ambient', color: '#A8D5E5' },
  [EnergyLevel.MEDIUM]: { label: 'Medium', color: '#F4C95F' },
  [EnergyLevel.HIGH]: { label: 'High Energy', color: '#F28482' },
  [EnergyLevel.PEAK]: { label: 'Peak / Anthem', color: '#C93862' },
};

// --- Factories -------------------------------------------------------------

export function createPlaylist(partial = {}) {
  return createEntity({
    weddingId: null,
    type: PlaylistType.CUSTOM,
    title: '',
    description: '',
    isLocked: false, // locked playlists are handed to DJ
    notesForDj: '',
    trackCount: 0,
    totalDurationSec: 0,
    sortOrder: 0,
    ...partial,
  });
}

export function createTrack(partial = {}) {
  return createEntity({
    weddingId: null,
    playlistId: null,
    title: '',
    artist: '',
    album: '',
    durationSec: 0,
    source: TrackSource.MANUAL,
    externalId: null,
    externalUrl: null,
    energy: EnergyLevel.MEDIUM,
    notes: '',
    isMustPlay: false,
    isDoNotPlay: false,
    orderInPlaylist: 0,
    suggestedByGuestId: null,
    ...partial,
  });
}

export function createDoNotPlayEntry(partial = {}) {
  return createEntity({
    weddingId: null,
    title: '',
    artist: '',
    reason: '',
    ...partial,
  });
}

export function createMusicMoment(partial = {}) {
  return createEntity({
    weddingId: null,
    name: '', // e.g. "Grand entrance"
    scheduledAt: null, // relative or absolute
    trackId: null,
    playlistId: null,
    notes: '',
    durationHintSec: 0,
    ...partial,
  });
}

// --- Helpers ---------------------------------------------------------------

export function formatDuration(sec) {
  if (!sec || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function playlistDuration(tracks) {
  return (tracks || []).reduce((sum, t) => sum + (t.durationSec || 0), 0);
}

export function tracksForPlaylist(playlistId, tracksCollection) {
  const list = Array.isArray(tracksCollection)
    ? tracksCollection
    : Object.values(tracksCollection?.byId || {});
  return list
    .filter((t) => t.playlistId === playlistId && !t.isDoNotPlay)
    .sort((a, b) => (a.orderInPlaylist ?? 0) - (b.orderInPlaylist ?? 0));
}

export function mustPlayTracks(tracksCollection) {
  const list = Array.isArray(tracksCollection)
    ? tracksCollection
    : Object.values(tracksCollection?.byId || {});
  return list.filter((t) => t.isMustPlay);
}

export function buildDefaultPlaylists(weddingId) {
  const defaults = [
    { type: PlaylistType.PROCESSIONAL, title: 'Processional' },
    { type: PlaylistType.CEREMONY, title: 'Ceremony Underscore' },
    { type: PlaylistType.RECESSIONAL, title: 'Recessional' },
    { type: PlaylistType.COCKTAIL, title: 'Cocktail Hour' },
    { type: PlaylistType.DINNER, title: 'Dinner Music' },
    { type: PlaylistType.FIRST_DANCE, title: 'First Dance' },
    { type: PlaylistType.PARENT_DANCE, title: 'Parent Dances' },
    { type: PlaylistType.DANCING, title: 'Reception Party' },
    { type: PlaylistType.LAST_SONG, title: 'Last Song of the Night' },
  ];
  return defaults.map((d, i) =>
    createPlaylist({
      weddingId,
      type: d.type,
      title: d.title,
      sortOrder: (PlaylistTypeMeta[d.type]?.order || 100) + i,
    })
  );
}

export function deriveMusicStats(playlists, tracks) {
  const pl = Array.isArray(playlists) ? playlists : Object.values(playlists?.byId || {});
  const tr = Array.isArray(tracks) ? tracks : Object.values(tracks?.byId || {});
  return {
    playlistCount: pl.length,
    trackCount: tr.length,
    mustPlayCount: tr.filter((t) => t.isMustPlay).length,
    doNotPlayCount: tr.filter((t) => t.isDoNotPlay).length,
    totalDurationSec: tr.reduce((s, t) => s + (t.durationSec || 0), 0),
  };
}
