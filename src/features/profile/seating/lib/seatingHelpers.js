export const SEATING_FIELD = 'profileWeddingSeating';

export function validateSeat(values = {}, records = [], editingId = null) {
  const errors = {};
  const guest = typeof values.guest === 'string' ? values.guest.trim() : '';
  const table = typeof values.table === 'string' ? values.table.trim() : '';
  const seat = typeof values.seat === 'string' ? values.seat.trim() : '';
  if (!guest) errors.guest = 'Add a guest label.';
  else if (guest.length > 80) errors.guest = 'Keep the guest label under 80 characters.';
  if (table.length > 50 || seat.length > 30) errors.position = 'Keep table and seat labels concise.';
  if (
    table &&
    seat &&
    records.some(
      (record) =>
        record.id !== editingId &&
        record.table?.trim().toLocaleLowerCase() === table.toLocaleLowerCase() &&
        record.seat?.trim().toLocaleLowerCase() === seat.toLocaleLowerCase()
    )
  ) {
    errors.position = 'That seat is already assigned.';
  }
  if (String(values.note ?? '').length > 300) errors.note = 'Keep notes under 300 characters.';
  return { isValid: Object.keys(errors).length === 0, errors };
}

export function normaliseSeat(values = {}) {
  return {
    guest: values.guest.trim(),
    table: String(values.table ?? '').trim(),
    seat: String(values.seat ?? '').trim(),
    note: String(values.note ?? '').trim(),
  };
}

export function filterSeating(records = [], filter = 'all', query = '') {
  const term = String(query).trim().toLocaleLowerCase();
  return records.filter((record) => {
    const assigned = Boolean(record.table || record.seat);
    return (
      (filter === 'all' || (filter === 'assigned' ? assigned : !assigned)) &&
      (!term ||
        [record.guest, record.table, record.seat, record.note].some((value) =>
          String(value ?? '')
            .toLocaleLowerCase()
            .includes(term)
        ))
    );
  });
}

export function summariseSeating(records = []) {
  const assigned = records.filter((record) => record.table || record.seat).length;
  return { total: records.length, assigned, unassigned: records.length - assigned };
}
