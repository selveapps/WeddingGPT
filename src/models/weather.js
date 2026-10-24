/**
 * Weather & Contingency Planner.
 *
 * Forecast snapshots, outdoor/indoor decision trees, backup plans,
 * and day-of weather checklists.
 */

import { createEntity } from './base';

export const ContingencyTrigger = {
  RAIN: 'rain',
  HIGH_WIND: 'high_wind',
  EXTREME_HEAT: 'extreme_heat',
  COLD: 'cold',
  STORM: 'storm',
  AIR_QUALITY: 'air_quality',
  OTHER: 'other',
};

export const ContingencyTriggerMeta = {
  [ContingencyTrigger.RAIN]: { label: 'Rain / Precipitation', emoji: '🌧️' },
  [ContingencyTrigger.HIGH_WIND]: { label: 'High wind', emoji: '💨' },
  [ContingencyTrigger.EXTREME_HEAT]: { label: 'Extreme heat', emoji: '🥵' },
  [ContingencyTrigger.COLD]: { label: 'Cold / Frost', emoji: '🥶' },
  [ContingencyTrigger.STORM]: { label: 'Storm / Lightning', emoji: '⛈️' },
  [ContingencyTrigger.AIR_QUALITY]: { label: 'Air quality', emoji: '😷' },
  [ContingencyTrigger.OTHER]: { label: 'Other', emoji: '⚠️' },
};

export const PlanStatus = {
  DRAFT: 'draft',
  READY: 'ready',
  ACTIVATED: 'activated',
  ARCHIVED: 'archived',
};

export function createWeatherSnapshot(partial = {}) {
  return createEntity({
    weddingId: null,
    locationName: '',
    latitude: null,
    longitude: null,
    forecastDate: null, // the day this snapshot is for
    fetchedAt: null,
    summary: '',
    tempHighC: null,
    tempLowC: null,
    precipProbability: null,
    precipType: null,
    windKph: null,
    uvIndex: null,
    humidity: null,
    raw: null, // optional raw API payload
    ...partial,
  });
}

export function createContingencyPlan(partial = {}) {
  return createEntity({
    weddingId: null,
    title: '',
    trigger: ContingencyTrigger.RAIN,
    status: PlanStatus.DRAFT,
    description: '',
    decisionDeadlineHoursBefore: 24,
    steps: [], // array of strings or structured later
    ownerGuestId: null, // who decides / executes
    relatedVendorIds: [],
    indoorBackupVenue: '',
    estimatedExtraCost: 0,
    currency: 'USD',
    notes: '',
    ...partial,
  });
}

export function createDayOfWeatherCheck(partial = {}) {
  return createEntity({
    weddingId: null,
    checkAt: null,
    temperatureC: null,
    conditions: '',
    decision: '', // "proceed outdoor" | "activate backup" | etc
    decidedBy: '',
    notes: '',
    ...partial,
  });
}

export function defaultRainPlan(weddingId) {
  return createContingencyPlan({
    weddingId,
    title: 'Rain Plan – Ceremony & Cocktail',
    trigger: ContingencyTrigger.RAIN,
    status: PlanStatus.DRAFT,
    description:
      'If precipitation probability exceeds 40% or rain is falling within 2 hours of ceremony start, move ceremony indoors and shift cocktail to covered terrace or ballroom.',
    decisionDeadlineHoursBefore: 18,
    steps: [
      'Check forecast at T-24h and T-6h',
      'Notify venue coordinator',
      'Notify officiant and photographer',
      'Update seating / processional path if needed',
      'Communicate change to wedding party via group chat',
      'Post update on wedding website / day-of group',
    ],
    estimatedExtraCost: 0,
  });
}

export function defaultHeatPlan(weddingId) {
  return createContingencyPlan({
    weddingId,
    title: 'Extreme Heat Plan',
    trigger: ContingencyTrigger.EXTREME_HEAT,
    status: PlanStatus.DRAFT,
    description: 'When forecast high exceeds 32°C / 90°F, activate shade, hydration, and schedule adjustments.',
    decisionDeadlineHoursBefore: 48,
    steps: [
      'Confirm additional shade structures or indoor AC rooms',
      'Order extra water stations and fans',
      'Shorten outdoor photos timeline',
      'Provide cold towels / misting for wedding party',
      'Move any outdoor speeches indoors if possible',
    ],
    estimatedExtraCost: 350,
  });
}

export function deriveWeatherReadiness(plans, snapshots) {
  const p = Array.isArray(plans) ? plans : Object.values(plans?.byId || {});
  const s = Array.isArray(snapshots) ? snapshots : Object.values(snapshots?.byId || {});
  const ready = p.filter((x) => x.status === PlanStatus.READY || x.status === PlanStatus.ACTIVATED);
  return {
    planCount: p.length,
    readyCount: ready.length,
    snapshotCount: s.length,
    latestSnapshot: s.sort((a, b) => (b.fetchedAt || 0) - (a.fetchedAt || 0))[0] || null,
  };
}
