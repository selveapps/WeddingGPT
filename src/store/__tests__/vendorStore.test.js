import { migrateVendorState, useVendorStore, selectAllVendors } from '../vendorStore';
import { PaymentId, VendorStatus } from '../../models';

const store = () => useVendorStore.getState();

beforeEach(() => {
  store().reset();
});

describe('vendorStore', () => {
  it('adds, updates and deletes vendors', () => {
    const vendor = store().addVendor({ weddingId: 'w', name: 'Abbey', categoryKey: 'venue' });
    expect(selectAllVendors(useVendorStore.getState())).toHaveLength(1);

    const updated = store().updateVendor(vendor.id, { city: 'Austin' });
    expect(updated.city).toBe('Austin');
    expect(updated.version).toBe(2);

    expect(store().deleteVendor(vendor.id)).toBe(true);
    expect(store().deleteVendor(vendor.id)).toBe(false);
    expect(store().updateVendor(vendor.id, { city: 'x' })).toBeNull();
  });

  it('accepts a function patch', () => {
    const vendor = store().addVendor({ name: 'Abbey', notes: 'a' });
    expect(store().updateVendor(vendor.id, (current) => ({ notes: `${current.notes}b` })).notes).toBe('ab');
  });

  it('records when a vendor is booked or contacted', () => {
    const vendor = store().addVendor({ name: 'Abbey' });

    const contacted = store().setStatus(vendor.id, VendorStatus.CONTACTED);
    expect(contacted.lastContactedAt).toEqual(expect.any(String));
    expect(contacted.bookedAt).toBeNull();

    const booked = store().setStatus(vendor.id, VendorStatus.BOOKED);
    expect(booked.bookedAt).toEqual(expect.any(String));

    // Saving other fields keeps the original booking time.
    expect(store().updateVendor(vendor.id, { status: VendorStatus.BOOKED, city: 'x' }).bookedAt).toBe(
      booked.bookedAt
    );

    expect(store().setStatus(vendor.id, VendorStatus.PASSED).bookedAt).toBeNull();
  });

  it('toggles a payment paid and back', () => {
    const vendor = store().addVendor({
      name: 'Abbey',
      payments: [{ id: PaymentId.DEPOSIT, label: 'Deposit', amount: 100, dueDate: null, paidAt: null }],
    });
    const paid = store().togglePaymentPaid(vendor.id, PaymentId.DEPOSIT);
    expect(paid.payments[0].paidAt).toEqual(expect.any(String));
    expect(store().togglePaymentPaid(vendor.id, PaymentId.DEPOSIT).payments[0].paidAt).toBeNull();
  });

  it('imports several vendors and remembers the Labs import', () => {
    const imported = store().importVendors([{ name: 'A' }, { name: 'B' }]);
    expect(imported).toHaveLength(2);
    expect(selectAllVendors(useVendorStore.getState()).map((v) => v.name)).toEqual(['A', 'B']);
    expect(store().importVendors([])).toEqual([]);

    expect(store().labsImportedAt).toBeNull();
    store().markLabsImported();
    expect(store().labsImportedAt).toEqual(expect.any(String));
  });

  it('reset clears vendors and the import flag', () => {
    store().addVendor({ name: 'A' });
    store().markLabsImported();
    store().reset();
    expect(selectAllVendors(useVendorStore.getState())).toEqual([]);
    expect(store().labsImportedAt).toBeNull();
  });
});

describe('migrateVendorState', () => {
  it('turns v1 deposit and balance fields into payments', () => {
    const v1 = {
      vendors: {
        allIds: ['v1'],
        byId: {
          v1: {
            id: 'v1',
            name: 'Abbey',
            quotedAmount: 1000,
            depositAmount: 300,
            depositDueAt: '2027-02-01',
            finalAmount: null,
            finalDueAt: '2027-08-01',
          },
        },
      },
    };
    const migrated = migrateVendorState(v1, 1);
    const vendor = migrated.vendors.byId.v1;
    expect(vendor.payments.map((p) => [p.id, p.amount, p.dueDate])).toEqual([
      [PaymentId.DEPOSIT, 300, '2027-02-01'],
      [PaymentId.BALANCE, 700, '2027-08-01'],
    ]);
    expect(vendor).not.toHaveProperty('depositAmount');
    expect(vendor).toMatchObject({ expenseId: null, quoteScope: '' });
    expect(migrated.labsImportedAt).toBeNull();
  });

  it('leaves current and empty state alone', () => {
    const v2 = { vendors: { allIds: [], byId: {} }, labsImportedAt: 'x' };
    expect(migrateVendorState(v2, 2)).toBe(v2);
    expect(migrateVendorState(undefined, 1)).toBeUndefined();
  });
});
