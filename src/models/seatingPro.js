/**
 * Visual Seating Designer – tables, seats, constraints, auto-suggest.
 */
import { createEntity } from './base';

export const TableShape = {
  ROUND: 'round', RECTANGLE: 'rectangle', OVAL: 'oval',
  SWEETHEART: 'sweetheart', HEAD: 'head', CUSTOM: 'custom',
};

export const TableShapeMeta = {
  round: { label: 'Round', defaultSeats: 8 },
  rectangle: { label: 'Rectangle', defaultSeats: 10 },
  oval: { label: 'Oval', defaultSeats: 10 },
  sweetheart: { label: 'Sweetheart', defaultSeats: 2 },
  head: { label: 'Head table', defaultSeats: 8 },
  custom: { label: 'Custom', defaultSeats: 6 },
};

export function createFloorPlan(partial = {}) {
  return createEntity({
    weddingId: null, title: 'Reception Floor Plan', width: 1000, height: 700,
    unit: 'px', notes: '', isActive: true, ...partial,
  });
}

export function createTable(partial = {}) {
  return createEntity({
    weddingId: null, floorPlanId: null, name: '', shape: TableShape.ROUND,
    seatCount: 8, x: 100, y: 100, rotation: 0, notes: '',
    isVip: false, dietaryFlags: [], ...partial,
  });
}

export function createSeat(partial = {}) {
  return createEntity({
    weddingId: null, tableId: null, index: 0, guestId: null,
    label: '', isLocked: false, notes: '', ...partial,
  });
}

export function createSeatingConstraint(partial = {}) {
  return createEntity({
    weddingId: null, type: 'must_sit_with', // must_sit_with | must_not | near | accessibility
    guestIds: [], tableId: null, notes: '', priority: 1, ...partial,
  });
}

export function seatsForTable(tableId, seats) {
  const list = Array.isArray(seats) ? seats : Object.values(seats?.byId || {});
  return list.filter((s) => s.tableId === tableId).sort((a, b) => (a.index || 0) - (b.index || 0));
}

export function tableOccupancy(table, seats) {
  const assigned = seatsForTable(table.id, seats).filter((s) => s.guestId);
  return {
    seated: assigned.length,
    capacity: table.seatCount || 0,
    free: Math.max(0, (table.seatCount || 0) - assigned.length),
  };
}

export function deriveSeatingStats(tables, seats, constraints) {
  const t = Array.isArray(tables) ? tables : Object.values(tables?.byId || {});
  const s = Array.isArray(seats) ? seats : Object.values(seats?.byId || {});
  const c = Array.isArray(constraints) ? constraints : Object.values(constraints?.byId || {});
  const assigned = s.filter((x) => x.guestId);
  return {
    tableCount: t.length,
    seatCount: s.length,
    assignedCount: assigned.length,
    constraintCount: c.length,
    totalCapacity: t.reduce((sum, x) => sum + (x.seatCount || 0), 0),
  };
}
