/**
 * Guest Experience & Hospitality module.
 *
 * Welcome packages, activity suggestions, kids corner, accessibility notes,
 * and day-of hospitality stations.
 */

import { createEntity } from './base';

export const ExperienceCategory = {
  WELCOME: 'welcome',
  ACTIVITY: 'activity',
  KIDS: 'kids',
  ACCESSIBILITY: 'accessibility',
  HOSPITALITY: 'hospitality',
  TRANSPORT_INFO: 'transport_info',
  OTHER: 'other',
};

export const ExperienceCategoryMeta = {
  [ExperienceCategory.WELCOME]: { label: 'Welcome & Arrival', emoji: '🎁' },
  [ExperienceCategory.ACTIVITY]: { label: 'Activities', emoji: '🎯' },
  [ExperienceCategory.KIDS]: { label: 'Kids Corner', emoji: '🧒' },
  [ExperienceCategory.ACCESSIBILITY]: { label: 'Accessibility', emoji: '♿' },
  [ExperienceCategory.HOSPITALITY]: { label: 'Hospitality Stations', emoji: '☕' },
  [ExperienceCategory.TRANSPORT_INFO]: { label: 'Getting Around', emoji: '🚗' },
  [ExperienceCategory.OTHER]: { label: 'Other', emoji: '✨' },
};

export function createExperienceItem(partial = {}) {
  return createEntity({
    weddingId: null,
    category: ExperienceCategory.OTHER,
    title: '',
    description: '',
    location: '',
    startAt: null,
    endAt: null,
    capacity: null,
    isPublic: true, // shown on guest website
    cost: 0,
    currency: 'USD',
    vendorId: null,
    notes: '',
    sortOrder: 0,
    ...partial,
  });
}

export function createWelcomeStation(partial = {}) {
  return createEntity({
    weddingId: null,
    name: '',
    items: [], // strings or { name, qty }
    location: '',
    responsibleGuestId: null,
    notes: '',
    ...partial,
  });
}

export function createAccessibilityNote(partial = {}) {
  return createEntity({
    weddingId: null,
    topic: '', // e.g. "Wheelchair access", "Hearing loop", "Quiet room"
    details: '',
    isPublished: true,
    ...partial,
  });
}

export function createKidsActivity(partial = {}) {
  return createEntity({
    weddingId: null,
    title: '',
    ageRange: '',
    description: '',
    supplies: [],
    supervisorGuestId: null,
    ...partial,
  });
}

export function itemsByCategory(items, category) {
  const list = Array.isArray(items) ? items : Object.values(items?.byId || {});
  return list
    .filter((i) => i.category === category)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function deriveGuestExperienceStats(items, stations, accessibility) {
  const i = Array.isArray(items) ? items : Object.values(items?.byId || {});
  const s = Array.isArray(stations) ? stations : Object.values(stations?.byId || {});
  const a = Array.isArray(accessibility) ? accessibility : Object.values(accessibility?.byId || {});
  return {
    experienceCount: i.length,
    publicCount: i.filter((x) => x.isPublic).length,
    stationCount: s.length,
    accessibilityNotes: a.length,
    publishedAccessibility: a.filter((x) => x.isPublished).length,
  };
}

export function defaultWelcomeIdeas(weddingId) {
  return [
    createExperienceItem({
      weddingId,
      category: ExperienceCategory.WELCOME,
      title: 'Welcome bags at hotel',
      description: 'Small local treats, water, schedule card, and a handwritten note.',
      sortOrder: 10,
    }),
    createExperienceItem({
      weddingId,
      category: ExperienceCategory.HOSPITALITY,
      title: 'Hydration station',
      description: 'Infused water and cold towels near the ceremony exit.',
      sortOrder: 20,
    }),
    createExperienceItem({
      weddingId,
      category: ExperienceCategory.KIDS,
      title: 'Kids activity table',
      description: 'Coloring pages, stickers, and quiet toys during dinner.',
      sortOrder: 30,
    }),
  ];
}
