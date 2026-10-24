/**
 * Vendor CRM & Reviews model – richer than base vendors.
 */
import { createEntity } from './base';

export const VendorStage = {
  RESEARCH: 'research', CONTACTED: 'contacted', MEETING: 'meeting',
  PROPOSAL: 'proposal', NEGOTIATING: 'negotiating', BOOKED: 'booked',
  DEPOSIT_PAID: 'deposit_paid', FINAL_PAID: 'final_paid', COMPLETE: 'complete', DECLINED: 'declined',
};

export const VendorStageMeta = {
  research: { label: 'Researching', tone: 'neutral', order: 10 },
  contacted: { label: 'Contacted', tone: 'info', order: 20 },
  meeting: { label: 'Meeting / Tasting', tone: 'info', order: 30 },
  proposal: { label: 'Proposal received', tone: 'warning', order: 40 },
  negotiating: { label: 'Negotiating', tone: 'warning', order: 50 },
  booked: { label: 'Booked', tone: 'success', order: 60 },
  deposit_paid: { label: 'Deposit paid', tone: 'success', order: 70 },
  final_paid: { label: 'Fully paid', tone: 'success', order: 80 },
  complete: { label: 'Complete', tone: 'success', order: 90 },
  declined: { label: 'Declined / Passed', tone: 'neutral', order: 100 },
};

export function createVendorLead(partial = {}) {
  return createEntity({
    weddingId: null, category: 'photography', name: '', company: '',
    email: '', phone: '', website: '', instagram: '', stage: VendorStage.RESEARCH,
    quotedPrice: 0, currency: 'USD', notes: '', rating: 0, isFavorite: false,
    source: '', // referral, google, instagram, etc
    nextFollowUpAt: null, ...partial,
  });
}

export function createVendorReview(partial = {}) {
  return createEntity({
    weddingId: null, vendorLeadId: null, rating: 5, title: '', body: '',
    wouldRecommend: true, categories: [], // quality, communication, value
    isPublic: false, ...partial,
  });
}

export function createVendorMessage(partial = {}) {
  return createEntity({
    weddingId: null, vendorLeadId: null, direction: 'outbound', // outbound | inbound
    subject: '', body: '', sentAt: null, channel: 'email', ...partial,
  });
}

export function createVendorComparison(partial = {}) {
  return createEntity({
    weddingId: null, category: 'photography', title: '',
    leadIds: [], criteria: ['price', 'style', 'availability', 'reviews'],
    notes: '', winnerLeadId: null, ...partial,
  });
}

export function leadsByStage(leads, stage) {
  const list = Array.isArray(leads) ? leads : Object.values(leads?.byId || {});
  return list.filter((l) => l.stage === stage);
}

export function deriveVendorCRMStats(leads, reviews) {
  const l = Array.isArray(leads) ? leads : Object.values(leads?.byId || {});
  const r = Array.isArray(reviews) ? reviews : Object.values(reviews?.byId || {});
  const booked = l.filter((x) => ['booked', 'deposit_paid', 'final_paid', 'complete'].includes(x.stage));
  return {
    leadCount: l.length,
    bookedCount: booked.length,
    favoriteCount: l.filter((x) => x.isFavorite).length,
    reviewCount: r.length,
    avgRating: r.length ? r.reduce((s, x) => s + (x.rating || 0), 0) / r.length : 0,
    pipelineValue: l.reduce((s, x) => s + (x.quotedPrice || 0), 0),
  };
}
