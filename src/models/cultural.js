/**
 * Cultural Traditions Pack – ceremonies, rituals, timelines by culture.
 */
import { createEntity } from './base';

export function createTradition(partial = {}) {
  return createEntity({
    weddingId: null, culture: '', name: '', description: '',
    timing: 'ceremony',
    durationMin: 15, requiredItems: [], notes: '', isIncluded: true, sortOrder: 0, ...partial,
  });
}

export function createCulturalChecklistItem(partial = {}) {
  return createEntity({
    weddingId: null, traditionId: null, label: '', isDone: false,
    assignee: '', dueDate: null, ...partial,
  });
}

export function createCulturalVendorNeed(partial = {}) {
  return createEntity({
    weddingId: null, traditionId: null, role: '', notes: '',
    isBooked: false, ...partial,
  });
}

export function sampleTraditions(weddingId, culture = 'general') {
  const catalog = {
    'South Asian': [
      { name: 'Mehndi', timing: 'before', durationMin: 180 },
      { name: 'Sangeet', timing: 'before', durationMin: 240 },
      { name: 'Baraat entrance', timing: 'ceremony', durationMin: 30 },
      { name: 'Mandap / ceremony rituals', timing: 'ceremony', durationMin: 90 },
      { name: 'Vidaai', timing: 'after', durationMin: 20 },
    ],
    'Jewish': [
      { name: 'Ketubah signing', timing: 'before', durationMin: 20 },
      { name: 'Bedeken', timing: 'before', durationMin: 15 },
      { name: 'Chuppah ceremony', timing: 'ceremony', durationMin: 30 },
      { name: 'Yichud', timing: 'after', durationMin: 15 },
      { name: 'Hora', timing: 'reception', durationMin: 20 },
    ],
    general: [
      { name: 'Unity ritual', timing: 'ceremony', durationMin: 10 },
      { name: 'Family blessing', timing: 'ceremony', durationMin: 5 },
    ],
  };
  const list = catalog[culture] || catalog.general;
  return list.map((t, i) => createTradition({
    weddingId, culture, name: t.name, timing: t.timing,
    durationMin: t.durationMin, sortOrder: i,
  }));
}

export function deriveCulturalStats(traditions, checklist) {
  const t = Array.isArray(traditions) ? traditions : Object.values(traditions?.byId || {});
  const c = Array.isArray(checklist) ? checklist : Object.values(checklist?.byId || {});
  return {
    traditionCount: t.length,
    includedCount: t.filter((x) => x.isIncluded).length,
    checklistTotal: c.length,
    checklistDone: c.filter((x) => x.isDone).length,
  };
}
