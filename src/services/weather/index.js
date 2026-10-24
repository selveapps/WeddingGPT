/**
 * Service layer helpers for weather.
 * Keep side-effects (file I/O, network, analytics) here so stores stay pure-ish.
 */

import { analytics } from '../analytics';

export const weatherService = {
  async prepareExport(payload) {
    // Placeholder for generating shareable / printable artifacts
    return {
      version: 1,
      generatedAt: new Date().toISOString(),
      payload,
    };
  },

  trackEvent(name, props = {}) {
    try {
      analytics?.track?.(name, props);
    } catch (_) {
      // analytics optional
    }
  },

  validate(entity) {
    const errors = [];
    if (!entity) errors.push('Entity required');
    return { ok: errors.length === 0, errors };
  },
};

export default weatherService;
