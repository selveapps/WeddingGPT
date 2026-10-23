import { filterSeating, normaliseSeat, summariseSeating, validateSeat } from '../seatingHelpers';

describe('seating helpers', () => {
  it('requires a guest and prevents duplicate table positions', () => {
    const records = [{ id: 'one', guest: 'A', table: 'Table 1', seat: '2' }];
    expect(validateSeat({ guest: 'B', table: 'table 1', seat: '2' }, records).errors.position).toBeTruthy();
    expect(validateSeat({ guest: 'B', table: 'Table 1', seat: '2' }, records, 'one').isValid).toBe(true);
  });
  it('filters assigned guests and normalizes labels', () => {
    const rows = [normaliseSeat({ guest: ' Ada ', table: ' 1 ' }), { guest: 'Sam' }];
    expect(filterSeating(rows, 'assigned')).toHaveLength(1);
    expect(summariseSeating(rows)).toMatchObject({ assigned: 1, unassigned: 1 });
  });
});
