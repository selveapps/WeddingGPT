/**
 * Attire status transitions.
 */
import { AttireStatus, AttireStatusMeta, canTransition } from '../../../models/attire';

export const STATUS_FLOW = [
  AttireStatus.IDEA,
  AttireStatus.RESEARCHING,
  AttireStatus.ORDERED,
  AttireStatus.RECEIVED,
  AttireStatus.FITTING,
  AttireStatus.ALTERATIONS,
  AttireStatus.READY,
  AttireStatus.PACKED,
];

export function nextStatus(current) {
  const idx = STATUS_FLOW.indexOf(current);
  if (idx < 0 || idx >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1];
}

export function prevStatus(current) {
  const idx = STATUS_FLOW.indexOf(current);
  if (idx <= 0) return null;
  return STATUS_FLOW[idx - 1];
}

export function allowedTransitions(from) {
  return STATUS_FLOW.filter((to) => canTransition(from, to));
}

export function statusSteps() {
  return STATUS_FLOW.map((id) => ({
    id,
    label: AttireStatusMeta[id]?.label || id,
    tone: AttireStatusMeta[id]?.tone || 'neutral',
  }));
}

export function advanceStatus(current) {
  return nextStatus(current) || current;
}
