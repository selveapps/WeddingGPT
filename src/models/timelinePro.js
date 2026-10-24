/**
 * Day-of Timeline Runner – minute-level schedule, owners, buffers, live mode.
 */
import { createEntity } from './base';

export const TimelineSlotType = {
  PREP: 'prep', CEREMONY: 'ceremony', COCKTAIL: 'cocktail', DINNER: 'dinner',
  SPEECH: 'speech', DANCE: 'dance', PHOTO: 'photo', TRANSITION: 'transition',
  VENDOR: 'vendor', CUSTOM: 'custom',
};

export const TimelineSlotTypeMeta = {
  prep: { label: 'Getting ready', emoji: '💄', color: '#E8D5C4' },
  ceremony: { label: 'Ceremony', emoji: '⛪', color: '#C93862' },
  cocktail: { label: 'Cocktail hour', emoji: '🥂', color: '#F4C95F' },
  dinner: { label: 'Dinner', emoji: '🍽️', color: '#A8D5E5' },
  speech: { label: 'Speeches', emoji: '🎤', color: '#B8E0D2' },
  dance: { label: 'Dancing', emoji: '💃', color: '#F28482' },
  photo: { label: 'Photos', emoji: '📸', color: '#C4B5E0' },
  transition: { label: 'Transition / Travel', emoji: '🚗', color: '#D4D4D4' },
  vendor: { label: 'Vendor cue', emoji: '📋', color: '#F5D0A9' },
  custom: { label: 'Custom', emoji: '✨', color: '#FAF7F5' },
};

export function createTimelineDay(partial = {}) {
  return createEntity({
    weddingId: null, title: 'Wedding Day', date: null,
    startTime: '08:00', endTime: '23:00', timezone: 'local',
    isLive: false, notes: '', ...partial,
  });
}

export function createTimelineSlot(partial = {}) {
  return createEntity({
    weddingId: null, dayId: null, type: TimelineSlotType.CUSTOM,
    title: '', description: '', startAt: null, endAt: null,
    durationMin: 15, bufferAfterMin: 5, location: '',
    ownerGuestId: null, ownerName: '', vendorIds: [],
    isPinned: false, isPublic: true, sortOrder: 0,
    status: 'planned', // planned | in_progress | done | skipped
    ...partial,
  });
}

export function createTimelineCue(partial = {}) {
  return createEntity({
    weddingId: null, slotId: null, title: '', offsetMin: 0,
    targetRole: 'coordinator', // coordinator | dj | photographer | couple
    notes: '', isFired: false, ...partial,
  });
}

export function slotsChronological(slots) {
  const list = Array.isArray(slots) ? slots : Object.values(slots?.byId || {});
  return list.slice().sort((a, b) => {
    if (a.startAt && b.startAt) return new Date(a.startAt) - new Date(b.startAt);
    return (a.sortOrder || 0) - (b.sortOrder || 0);
  });
}

export function deriveTimelineStats(days, slots) {
  const d = Array.isArray(days) ? days : Object.values(days?.byId || {});
  const s = Array.isArray(slots) ? slots : Object.values(slots?.byId || {});
  const totalMin = s.reduce((sum, x) => sum + (x.durationMin || 0) + (x.bufferAfterMin || 0), 0);
  return {
    dayCount: d.length,
    slotCount: s.length,
    totalMinutes: totalMin,
    publicSlots: s.filter((x) => x.isPublic).length,
    doneCount: s.filter((x) => x.status === 'done').length,
  };
}

export function buildSampleWeddingDay(weddingId) {
  const day = createTimelineDay({ weddingId, title: 'Wedding Day', startTime: '09:00', endTime: '23:00' });
  const samples = [
    { type: 'prep', title: 'Hair & makeup', durationMin: 180 },
    { type: 'photo', title: 'First look & couple portraits', durationMin: 45 },
    { type: 'ceremony', title: 'Ceremony', durationMin: 30 },
    { type: 'cocktail', title: 'Cocktail hour', durationMin: 60 },
    { type: 'dinner', title: 'Reception entrance & dinner', durationMin: 90 },
    { type: 'speech', title: 'Toasts', durationMin: 25 },
    { type: 'dance', title: 'First dance & party', durationMin: 120 },
    { type: 'custom', title: 'Grand exit', durationMin: 15 },
  ];
  const slots = samples.map((s, i) => createTimelineSlot({
    weddingId, dayId: day.id, type: s.type, title: s.title,
    durationMin: s.durationMin, sortOrder: (i + 1) * 10,
  }));
  return { day, slots };
}
