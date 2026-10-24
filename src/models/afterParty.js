/**
 * After-Party & Late Night planner.
 */
import { createEntity } from './base';

export function createAfterParty(partial = {}) {
  return createEntity({
    weddingId: null, title: 'After Party', startTime: '', endTime: '',
    venueName: '', address: '', isPrivate: true, capacity: 0,
    budget: 0, currency: 'USD', notes: '', ...partial,
  });
}

export function createLateNightFood(partial = {}) {
  return createEntity({
    weddingId: null, partyId: null, name: '', vendor: '',
    serveTime: '', cost: 0, servings: 0, notes: '', ...partial,
  });
}

export function createAfterPartyPlaylistNote(partial = {}) {
  return createEntity({
    weddingId: null, partyId: null, vibe: 'high_energy', notes: '',
    mustPlay: [], doNotPlay: [], ...partial,
  });
}

export function deriveAfterPartyStats(parties, foods) {
  const p = Array.isArray(parties) ? parties : Object.values(parties?.byId || {});
  const f = Array.isArray(foods) ? foods : Object.values(foods?.byId || {});
  return {
    partyCount: p.length,
    foodStations: f.length,
    totalFoodCost: f.reduce((s, x) => s + (x.cost || 0), 0),
  };
}
