import { addExpense, effectiveCost, filterExpenses, getBudgetSummary, validateExpense } from '../budgetModel';
import { addGuest, countGuestSeats, filterGuests, summarizeGuests, validateGuest } from '../guestModel';
import { addTable, assignGuest, getSeatingSummary, validateSeating } from '../seatingModel';

describe('budget model', () => {
  test('uses actual cost when present and estimate otherwise', () => {
    expect(effectiveCost({ estimated: 500, actual: 700 })).toBe(700);
    expect(effectiveCost({ estimated: 500, actual: 0 })).toBe(500);
  });
  test('summarizes budget and identifies overspend', () => {
    const result = getBudgetSummary([{ title:'Venue', estimated:1000, actual:1200, paid:300 }], 1000);
    expect(result.actual).toBe(1200);
    expect(result.unpaid).toBe(900);
    expect(result.overBudget).toBe(true);
  });
  test('validates negative amounts and missing titles', () => {
    expect(validateExpense({ title:'', category:'Venue', estimated:-2, actual:0, paid:0 })).toHaveProperty('title');
    expect(validateExpense({ title:'Venue', category:'Venue', estimated:-2, actual:0, paid:0 })).toHaveProperty('estimated');
  });
  test('filters expenses by category and query', () => {
    const items = [{ title:'Venue hall', category:'Venue' }, { title:'Photo album', category:'Photography' }];
    expect(filterExpenses(items, { query:'hall', category:'Venue' })).toHaveLength(1);
  });
  test('adds expense without mutating source array', () => {
    const original = [];
    const next = addExpense(original, { title:'Food', category:'Catering' });
    expect(original).toHaveLength(0);
    expect(next).toHaveLength(1);
  });
});

describe('guest model', () => {
  test('counts plus-one seats except declined guests', () => {
    expect(countGuestSeats({ name:'A', rsvp:'Confirmed', plusOne:true })).toBe(2);
    expect(countGuestSeats({ name:'B', rsvp:'Declined', plusOne:true })).toBe(0);
  });
  test('summarizes RSVP states and possible seats', () => {
    const summary = summarizeGuests([{ name:'A', rsvp:'Confirmed', plusOne:true }, { name:'B', rsvp:'Pending' }]);
    expect(summary.confirmed).toBe(1);
    expect(summary.possibleSeats).toBe(3);
  });
  test('rejects malformed email', () => {
    expect(validateGuest({ name:'Guest', email:'wrong-email' })).toHaveProperty('email');
  });
  test('filters guests by RSVP', () => {
    expect(filterGuests([{ name:'A', rsvp:'Confirmed' }, { name:'B', rsvp:'Pending' }], { rsvp:'Pending' })).toHaveLength(1);
  });
  test('adds guest without mutating input', () => {
    const input = [];
    expect(addGuest(input, { name:'Sam' })).toHaveLength(1);
    expect(input).toHaveLength(0);
  });
});

describe('seating model', () => {
  test('prevents assigning declined guests', () => {
    const tables = addTable([], { name:'Table 1', capacity:4 });
    const result = assignGuest(tables, [{ id:'g1', name:'Guest', rsvp:'Declined' }], 'g1', tables[0].id);
    expect(result.error).toMatch(/Declined/);
  });
  test('prevents assigning more guests than table capacity', () => {
    const tables = addTable([], { name:'Table 1', capacity:1 });
    const guests = [{ id:'g1', name:'A', rsvp:'Confirmed' }, { id:'g2', name:'B', rsvp:'Confirmed' }];
    const first = assignGuest(tables, guests, 'g1', tables[0].id);
    const second = assignGuest(first.tables, first.guests, 'g2', tables[0].id);
    expect(second.error).toMatch(/no empty seats/);
  });
  test('summarizes empty seats and unassigned guests', () => {
    const tables = addTable([], { name:'Table 1', capacity:4 });
    const summary = getSeatingSummary(tables, [{ id:'g1', name:'Guest', rsvp:'Confirmed' }]);
    expect(summary.seatsAvailable).toBe(4);
    expect(summary.unassignedCount).toBe(1);
  });
  test('reports duplicate assignments', () => {
    const errors = validateSeating([{ id:'t1', name:'One', capacity:4, guestIds:['g1'] }, { id:'t2', name:'Two', capacity:4, guestIds:['g1'] }], [{ id:'g1', name:'Guest' }]);
    expect(errors.some((error) => error.includes('more than one table'))).toBe(true);
  });
});
