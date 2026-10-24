/**
 * Documents, Contracts & Legal checklist.
 *
 * Marriage license tracking, vendor contracts, insurance, prenup notes
 * (optional), and file attachments metadata.
 */

import { createEntity } from './base';

export const DocumentType = {
  MARRIAGE_LICENSE: 'marriage_license',
  VENDOR_CONTRACT: 'vendor_contract',
  INSURANCE: 'insurance',
  PRENUP: 'prenup',
  VENUE_AGREEMENT: 'venue_agreement',
  PERMIT: 'permit',
  ID: 'id',
  OTHER: 'other',
};

export const DocumentTypeMeta = {
  [DocumentType.MARRIAGE_LICENSE]: { label: 'Marriage License', emoji: '📜', critical: true },
  [DocumentType.VENDOR_CONTRACT]: { label: 'Vendor Contract', emoji: '📝', critical: true },
  [DocumentType.INSURANCE]: { label: 'Insurance', emoji: '🛡️', critical: true },
  [DocumentType.PRENUP]: { label: 'Prenuptial Agreement', emoji: '⚖️', critical: false },
  [DocumentType.VENUE_AGREEMENT]: { label: 'Venue Agreement', emoji: '🏛️', critical: true },
  [DocumentType.PERMIT]: { label: 'Permit / License', emoji: '✅', critical: false },
  [DocumentType.ID]: { label: 'Identification', emoji: '🪪', critical: false },
  [DocumentType.OTHER]: { label: 'Other', emoji: '📎', critical: false },
};

export const DocumentStatus = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  EXPIRED: 'expired',
  ARCHIVED: 'archived',
};

export const DocumentStatusMeta = {
  [DocumentStatus.NOT_STARTED]: { label: 'Not started', tone: 'neutral' },
  [DocumentStatus.IN_PROGRESS]: { label: 'In progress', tone: 'info' },
  [DocumentStatus.SUBMITTED]: { label: 'Submitted', tone: 'warning' },
  [DocumentStatus.APPROVED]: { label: 'Approved / Complete', tone: 'success' },
  [DocumentStatus.EXPIRED]: { label: 'Expired', tone: 'danger' },
  [DocumentStatus.ARCHIVED]: { label: 'Archived', tone: 'neutral' },
};

export function createDocument(partial = {}) {
  return createEntity({
    weddingId: null,
    type: DocumentType.OTHER,
    title: '',
    description: '',
    status: DocumentStatus.NOT_STARTED,
    vendorId: null,
    dueDate: null,
    completedAt: null,
    expiresAt: null,
    fileUri: null,
    fileName: null,
    fileSize: 0,
    mimeType: null,
    notes: '',
    reminderDaysBefore: 14,
    isCritical: false,
    ...partial,
  });
}

export function createContractClause(partial = {}) {
  return createEntity({
    documentId: null,
    weddingId: null,
    title: '',
    body: '',
    isNegotiable: true,
    isAccepted: false,
    ...partial,
  });
}

export function createLicenseChecklistItem(partial = {}) {
  return createEntity({
    weddingId: null,
    label: '',
    isDone: false,
    notes: '',
    sortOrder: 0,
    ...partial,
  });
}

export function documentsByType(docs, type) {
  const list = Array.isArray(docs) ? docs : Object.values(docs?.byId || {});
  return list.filter((d) => d.type === type);
}

export function criticalOpenDocuments(docs) {
  const list = Array.isArray(docs) ? docs : Object.values(docs?.byId || {});
  return list.filter(
    (d) =>
      (d.isCritical || DocumentTypeMeta[d.type]?.critical) &&
      d.status !== DocumentStatus.APPROVED &&
      d.status !== DocumentStatus.ARCHIVED
  );
}

export function deriveDocumentStats(docs) {
  const list = Array.isArray(docs) ? docs : Object.values(docs?.byId || {});
  const byStatus = {};
  for (const s of Object.values(DocumentStatus)) byStatus[s] = 0;
  for (const d of list) byStatus[d.status] = (byStatus[d.status] || 0) + 1;
  return {
    total: list.length,
    byStatus,
    criticalOpen: criticalOpenDocuments(list).length,
    withFiles: list.filter((d) => d.fileUri).length,
  };
}

export function defaultMarriageLicenseChecklist(weddingId) {
  const items = [
    'Confirm residency / jurisdiction requirements',
    'Book appointment or check walk-in hours',
    'Gather required IDs (passport, driver license, birth certificate)',
    'Complete application form',
    'Pay license fee',
    'Obtain license',
    'Confirm validity window before ceremony',
    'Deliver license to officiant',
    'Return signed license to registry after ceremony',
  ];
  return items.map((label, i) =>
    createLicenseChecklistItem({ weddingId, label, sortOrder: i })
  );
}
