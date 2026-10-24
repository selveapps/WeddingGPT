/**
 * Content & Social Studio – captions, post calendar, hashtags, shot lists.
 */
import { createEntity } from './base';

export const ContentType = {
  CAPTION: 'caption', POST: 'post', STORY: 'story', REEL: 'reel',
  EMAIL: 'email', WEBSITE: 'website', SHOT_LIST: 'shot_list',
};

export function createContentPiece(partial = {}) {
  return createEntity({
    weddingId: null, type: ContentType.CAPTION, title: '', body: '',
    platform: 'instagram', status: 'draft', scheduledAt: null,
    hashtags: [], mediaUris: [], isFavorite: false, ...partial,
  });
}

export function createHashtagSet(partial = {}) {
  return createEntity({
    weddingId: null, name: '', tags: [], notes: '', ...partial,
  });
}

export function createShotListItem(partial = {}) {
  return createEntity({
    weddingId: null, title: '', description: '', location: '',
    priority: 2, isMustHave: false, completed: false, sortOrder: 0, ...partial,
  });
}

export function createContentCalendarEntry(partial = {}) {
  return createEntity({
    weddingId: null, contentId: null, publishAt: null, platform: 'instagram',
    status: 'scheduled', notes: '', ...partial,
  });
}

export function deriveContentStats(pieces, shots) {
  const p = Array.isArray(pieces) ? pieces : Object.values(pieces?.byId || {});
  const s = Array.isArray(shots) ? shots : Object.values(shots?.byId || {});
  return {
    pieceCount: p.length,
    draftCount: p.filter((x) => x.status === 'draft').length,
    scheduledCount: p.filter((x) => x.status === 'scheduled').length,
    shotCount: s.length,
    mustHaveShots: s.filter((x) => x.isMustHave).length,
    completedShots: s.filter((x) => x.completed).length,
  };
}
