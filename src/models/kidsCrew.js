/**
 * Kids & Family Coordinator.
 */
import { createEntity } from './base';

export function createKidsPlan(partial = {}) {
  return createEntity({
    weddingId: null, title: 'Kids plan', supervisionMode: 'parents', // parents | hired | mixed
    ageGroups: [], notes: '', budget: 0, currency: 'USD', ...partial,
  });
}

export function createKidsActivity(partial = {}) {
  return createEntity({
    weddingId: null, planId: null, title: '', ageMin: 0, ageMax: 12,
    durationMin: 30, supplies: [], location: '', supervisorName: '', ...partial,
  });
}

export function createChildGuestNote(partial = {}) {
  return createEntity({
    weddingId: null, guestId: null, age: null, allergies: '',
    needs: '', emergencyContact: '', notes: '', ...partial,
  });
}

export function deriveKidsStats(plans, activities, notes) {
  const p = Array.isArray(plans) ? plans : Object.values(plans?.byId || {});
  const a = Array.isArray(activities) ? activities : Object.values(activities?.byId || {});
  const n = Array.isArray(notes) ? notes : Object.values(notes?.byId || {});
  return {
    planCount: p.length,
    activityCount: a.length,
    childNotes: n.length,
  };
}
