/**
 * Pure selectors for attire feature UI.
 */
import {
  AttireRoleMeta, AttireStatusMeta, FittingStatusMeta, groupAttireByRole,
  statusRank, AttireStatus,
} from '../../../models/attire';

export function boardSections(items) {
  const groups = groupAttireByRole(items);
  const order = ['couple', 'party', 'family', 'other'];
  const sections = [];
  const byGroup = {};
  for (const [role, list] of Object.entries(groups)) {
    const meta = AttireRoleMeta[role] || AttireRoleMeta.other;
    const g = meta.group || 'other';
    if (!byGroup[g]) byGroup[g] = [];
    byGroup[g].push({
      role,
      label: meta.label,
      emoji: meta.emoji,
      items: list.slice().sort((a, b) => statusRank(a.status) - statusRank(b.status)),
    });
  }
  for (const g of order) {
    if (byGroup[g]?.length) {
      sections.push({ group: g, title: g.charAt(0).toUpperCase() + g.slice(1), roles: byGroup[g] });
    }
  }
  return sections;
}

export function filterItems(items, { role, status, query, rentalOnly, needsFitting } = {}) {
  let list = Array.isArray(items) ? items.slice() : [];
  if (role && role !== 'all') list = list.filter((i) => i.role === role);
  if (status && status !== 'all') list = list.filter((i) => i.status === status);
  if (rentalOnly) list = list.filter((i) => i.rental);
  if (needsFitting) {
    list = list.filter((i) =>
      [AttireStatus.ORDERED, AttireStatus.RECEIVED, AttireStatus.FITTING, AttireStatus.ALTERATIONS].includes(i.status)
    );
  }
  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    list = list.filter((i) =>
      [i.title, i.wearerName, i.brand, i.color, i.notes].some((v) =>
        String(v || '').toLowerCase().includes(q)
      )
    );
  }
  return list;
}

export function progressPercent(stats) {
  if (!stats?.itemCount) return 0;
  return Math.round((stats.readyRatio || 0) * 100);
}

export function formatMoney(amount, currency = 'USD') {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount || 0);
  } catch {
    return `${currency} ${Math.round(amount || 0)}`;
  }
}

export function statusLabel(status) {
  return AttireStatusMeta[status]?.label || status || '—';
}

export function statusTone(status) {
  return AttireStatusMeta[status]?.tone || 'neutral';
}

export function fittingLabel(status) {
  return FittingStatusMeta[status]?.label || status || '—';
}

export function roleOptions() {
  return Object.entries(AttireRoleMeta).map(([value, meta]) => ({
    value, label: `${meta.emoji} ${meta.label}`,
  }));
}

export function upcomingFittings(fittings, limit = 5) {
  const list = Array.isArray(fittings) ? fittings : [];
  return list
    .filter((f) => f.status === 'scheduled' && f.scheduledAt)
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
    .slice(0, limit);
}

export function costByRole(items) {
  const map = {};
  for (const item of items || []) {
    const r = item.role || 'other';
    map[r] = (map[r] || 0) + (item.cost || 0);
  }
  return map;
}

export function readinessIssues(items, fittings, accessories) {
  const issues = [];
  for (const item of items || []) {
    if (!item.size && item.status !== 'idea') {
      issues.push({ type: 'missing_size', itemId: item.id, message: `${item.title || 'Item'} has no size` });
    }
    if (item.rental && !item.rentalReturnDate) {
      issues.push({ type: 'rental_return', itemId: item.id, message: `${item.title || 'Rental'} missing return date` });
    }
    if (item.isPrimary && item.status === 'idea') {
      issues.push({ type: 'primary_idea', itemId: item.id, message: `Primary look still an idea: ${item.title || item.role}` });
    }
  }
  const itemIdsWithFitting = new Set((fittings || []).map((f) => f.attireItemId));
  for (const item of items || []) {
    if (['ordered', 'received', 'fitting'].includes(item.status) && !itemIdsWithFitting.has(item.id)) {
      issues.push({ type: 'no_fitting', itemId: item.id, message: `No fitting scheduled for ${item.title || 'item'}` });
    }
  }
  return issues;
}
