import { formValuesFromVendor, vendorFieldsFromForm } from '../useVendors';
import { PaymentId } from '@/models';

const PAID = '2027-01-02T10:00:00.000Z';

describe('vendorFieldsFromForm', () => {
  it('turns the deposit and balance fields into payments', () => {
    const fields = vendorFieldsFromForm({
      name: 'Abbey',
      quotedAmount: 1000,
      depositAmount: 300,
      depositDueAt: '2027-02-01',
      finalAmount: null,
      finalDueAt: '2027-08-01',
    });
    expect(fields).not.toHaveProperty('depositAmount');
    expect(fields).not.toHaveProperty('finalDueAt');
    expect(fields.name).toBe('Abbey');
    expect(fields.payments.map((p) => [p.id, p.amount, p.dueDate])).toEqual([
      [PaymentId.DEPOSIT, 300, '2027-02-01'],
      [PaymentId.BALANCE, 700, '2027-08-01'],
    ]);
  });

  it('keeps payments that were already marked paid', () => {
    const existing = {
      payments: [{ id: PaymentId.DEPOSIT, label: 'Deposit', amount: 300, dueDate: null, paidAt: PAID }],
    };
    const fields = vendorFieldsFromForm({ quotedAmount: 1000, depositAmount: 400 }, existing);
    expect(fields.payments[0]).toMatchObject({ amount: 400, paidAt: PAID });
  });
});

describe('formValuesFromVendor', () => {
  it('reads payments back into form fields', () => {
    const vendor = {
      name: 'Abbey',
      quotedAmount: 1000,
      payments: [
        { id: PaymentId.DEPOSIT, amount: 300, dueDate: '2027-02-01', paidAt: null },
        { id: PaymentId.BALANCE, amount: 700, dueDate: null, paidAt: null },
      ],
    };
    expect(formValuesFromVendor(vendor)).toMatchObject({
      name: 'Abbey',
      depositAmount: 300,
      depositDueAt: '2027-02-01',
      finalAmount: 700,
      finalDueAt: null,
    });
    expect(formValuesFromVendor(null)).toBeNull();
  });
});
