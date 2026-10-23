import {
  ExpenseCommitment,
  UNCATEGORISED,
  WHOLE_WEDDING,
  categoryReport,
  createBudgetCategory,
  createExpense,
  createWeddingEvent,
  eventReport,
  financeReportCsv,
  heaviestMonth,
  moneyFigures,
  paymentsDueByMonth,
  reportTotals,
  summariseBudget,
} from '@/models';
import { parseCsv } from '@/lib/csv';

const { COMMITTED, ESTIMATED } = ExpenseCommitment;
const venue = createBudgetCategory({ name: 'Venue', allocated: 10000_00, order: 0 });
const flowers = createBudgetCategory({ name: 'Flowers', allocated: 1000_00, order: 1 });
const mehndi = createWeddingEvent({ kind: 'mehndi', date: '2027-05-07' });

const cost = (fields) => createExpense({ title: 'x', ...fields });
const expenses = [
  cost({
    budgetCategoryId: venue.id,
    amount: 8000_00,
    paidAmount: 2000_00,
    commitment: COMMITTED,
    dueDate: '2027-03-15',
  }),
  cost({
    budgetCategoryId: flowers.id,
    amount: 900_00,
    commitment: COMMITTED,
    dueDate: '2027-02-01',
    eventId: mehndi.id,
  }),
  cost({ budgetCategoryId: flowers.id, amount: 300_00, commitment: ESTIMATED }),
  cost({ budgetCategoryId: 'bcat_deleted', amount: 50_00, paidAmount: 50_00, commitment: COMMITTED }),
];
const from = new Date(2027, 0, 10);

describe('moneyFigures', () => {
  it('splits paid, committed and estimated like summariseBudget', () => {
    const figures = moneyFigures(expenses);
    const summary = summariseBudget(0, expenses);
    expect(figures).toMatchObject({
      paid: summary.spent,
      committed: summary.committed,
      estimated: summary.estimated,
      carried: summary.allocated,
      count: 4,
    });
  });

  it('ignores overpayment and negative amounts', () => {
    expect(moneyFigures([cost({ amount: 100, paidAmount: 500, commitment: COMMITTED })])).toMatchObject({
      paid: 100,
      committed: 0,
    });
    expect(moneyFigures([cost({ amount: -100 })]).estimated).toBe(0);
  });
});

describe('categoryReport', () => {
  it('compares each category with its plan and flags overspends', () => {
    const [venueRow, flowersRow, looseRow] = categoryReport([flowers, venue], expenses);
    expect(venueRow).toMatchObject({
      name: 'Venue',
      planned: 10000_00,
      paid: 2000_00,
      committed: 6000_00,
      overBy: 0,
    });
    // 900 committed is under the 1000 plan; the 300 estimate would take it over.
    expect(flowersRow).toMatchObject({
      name: 'Flowers',
      carried: 900_00,
      overBy: 0,
      projectedOverBy: 200_00,
    });
    expect(looseRow).toMatchObject({ id: null, name: UNCATEGORISED, planned: 0, overBy: 50_00 });
  });

  it('has no uncategorised row when everything is filed', () => {
    expect(categoryReport([venue], expenses.slice(0, 1)).map((r) => r.name)).toEqual(['Venue']);
  });
});

describe('reportTotals', () => {
  it('sets everything against the total and shows unplanned money', () => {
    const totals = reportTotals(10000_00, [venue, flowers], expenses);
    expect(totals).toMatchObject({ planned: 10000_00, carried: 8950_00, overBy: 0, allocated: 11000_00 });
    expect(totals.unallocated).toBe(-1000_00);
    expect(reportTotals(5000_00, [], expenses).overBy).toBe(3950_00);
  });
});

describe('eventReport', () => {
  it('shows each event, then the wedding as a whole', () => {
    const rows = eventReport([mehndi], expenses);
    expect(rows.map((r) => r.name)).toEqual(['Mehndi', WHOLE_WEDDING]);
    expect(rows[0]).toMatchObject({ committed: 900_00, count: 1 });
    expect(rows[1].count).toBe(3);
  });

  it('counts costs of a deleted event as the whole wedding', () => {
    const rows = eventReport([], [cost({ amount: 10, eventId: 'event_gone' })]);
    expect(rows.map((r) => r.name)).toEqual([WHOLE_WEDDING]);
  });
});

describe('paymentsDueByMonth', () => {
  it('buckets what is still to pay by month, for twelve months from this one', () => {
    const due = paymentsDueByMonth(expenses, { from });
    expect(due.months).toHaveLength(12);
    expect(due.months[0]).toMatchObject({ month: '2027-01', total: 0 });
    expect(due.months[1]).toMatchObject({ month: '2027-02', total: 900_00, count: 1 });
    expect(due.months[2]).toMatchObject({ month: '2027-03', total: 6000_00, count: 1 });
    expect(due.months[11].month).toBe('2027-12');
    expect(due.months[1].label).toBe('February 2027');
  });

  it('separates overdue, later and undated committed money; skips undated estimates', () => {
    const due = paymentsDueByMonth(
      [
        cost({ amount: 100, commitment: COMMITTED, dueDate: '2027-01-05' }),
        cost({ amount: 200, commitment: COMMITTED, dueDate: '2028-01-01' }),
        cost({ amount: 300, commitment: COMMITTED }),
        cost({ amount: 400, commitment: ESTIMATED }),
        cost({ amount: 500, paidAmount: 500, commitment: COMMITTED, dueDate: '2027-02-01' }),
      ],
      { from }
    );
    expect([due.overdue.total, due.later.total, due.undated.total]).toEqual([100, 200, 300]);
    expect(due.months.every((m) => m.total === 0)).toBe(true);
    expect(due.total).toBe(600);
  });

  it('finds the heaviest month', () => {
    expect(heaviestMonth(paymentsDueByMonth(expenses, { from })).month).toBe('2027-03');
    expect(heaviestMonth(paymentsDueByMonth([], { from }))).toBeNull();
  });
});

describe('financeReportCsv', () => {
  it('writes all three sections in major units', () => {
    const csv = financeReportCsv({
      total: 10000_00,
      categories: [venue, flowers],
      expenses,
      events: [mehndi],
      currency: 'USD',
      from,
    });
    // parseCsv pads rows to the widest one; compare without the padding.
    const rows = parseCsv(csv).map((r) => {
      const cells = [...r];
      while (cells.length && cells.at(-1) === '') cells.pop();
      return cells;
    });
    const find = (label) => rows.find((r) => r[0] === label);
    expect(rows[0]).toEqual(['Budget report (USD)', '2027-01-10']);
    expect(find('Venue')).toEqual(['Venue', '10000', '2000', '6000', '0', '0']);
    expect(find(UNCATEGORISED).at(-1)).toBe('50');
    expect(find('Mehndi')).toEqual(['Mehndi', '0', '900', '0', '1']);
    expect(find('March 2027')).toEqual(['March 2027', '6000', '1']);
    expect(find('Total')[1]).toBe('10000');
  });

  it('leaves the event section out when there are no events', () => {
    const csv = financeReportCsv({ categories: [venue], expenses: [], currency: 'USD', from });
    expect(csv).not.toContain('By event');
    expect(csv).toContain('Payments due');
  });

  it('guards names a spreadsheet would run as formulas', () => {
    const evil = createBudgetCategory({ name: '=HYPERLINK("x")', allocated: 0 });
    expect(financeReportCsv({ categories: [evil], expenses: [], from })).toContain(`"'=HYPERLINK(""x"")"`);
  });
});
