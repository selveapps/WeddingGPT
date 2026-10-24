/**
 * Service helpers for After-Party & Late Night.
 */
import { analytics } from '../analytics';

export const afterPartyService = {
  async prepareExport(payload) {
    return { version: 1, generatedAt: new Date().toISOString(), payload };
  },
  track(name, props = {}) {
    try { analytics?.track?.(name, props); } catch (_) {}
  },
  validate(entity) {
    const errors = [];
    if (!entity) errors.push('Entity required');
    return { ok: errors.length === 0, errors };
  },
};

export default afterPartyService;
