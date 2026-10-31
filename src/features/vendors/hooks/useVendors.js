import { useCallback, useEffect, useMemo } from 'react';

import { milestonesFromPayments, paymentsFromMilestones, vendorToExpenseDraft } from '@/models';
import { useVendorStore, selectAllVendors, selectLabsImportedAt } from '@/store/vendorStore';
import { useWeddingStore, selectWedding } from '@/store/weddingStore';
import { useBudgetStore } from '@/store/budgetStore';

import { filterVendors, sortVendors, summariseVendorList } from '../lib/vendorHelpers';
import { VENDOR_SORT, VendorFilter } from '../lib/vendorConstants';
import { importLabVendors } from '../lib/labsImport';

/** Form values (deposit and balance as fields) -> the fields a vendor stores. */
export function vendorFieldsFromForm(values, existing = null) {
  // Appointments are edited on the vendor screen, never by the form; leaving
  // them out means saving the form cannot undo a change synced meanwhile.
  const { depositAmount, depositDueAt, finalAmount, finalDueAt, appointments, meetingAt, ...fields } = values;
  return {
    ...fields,
    payments: paymentsFromMilestones(
      { quotedAmount: values.quotedAmount, depositAmount, depositDueAt, finalAmount, finalDueAt },
      existing?.payments ?? []
    ),
  };
}

/** A stored vendor -> form values. */
export function formValuesFromVendor(vendor) {
  return vendor ? { ...vendor, ...milestonesFromPayments(vendor) } : null;
}

export function useVendors({ filter = VendorFilter.ALL, sort = VENDOR_SORT.UPDATED } = {}) {
  const allVendors = useVendorStore(selectAllVendors);
  const labsImportedAt = useVendorStore(selectLabsImportedAt);
  const wedding = useWeddingStore(selectWedding);
  const addExpense = useBudgetStore((state) => state.addExpense);

  const { addVendor, updateVendor, deleteVendor, setStatus, togglePaymentPaid } = useVendorStore.getState();

  const weddingId = wedding?.id ?? null;

  // Bring over anything saved in the Labs vendor manager, once.
  useEffect(() => {
    if (!labsImportedAt) importLabVendors({ weddingId });
  }, [labsImportedAt, weddingId]);

  const vendors = useMemo(
    () => sortVendors(filterVendors(allVendors, filter), sort),
    [allVendors, filter, sort]
  );
  const summary = useMemo(() => summariseVendorList(allVendors), [allVendors]);

  const createVendor = useCallback(
    (values) => addVendor({ ...vendorFieldsFromForm(values), weddingId }),
    [addVendor, weddingId]
  );

  const saveVendor = useCallback(
    (vendor, values) => updateVendor(vendor.id, vendorFieldsFromForm(values, vendor)),
    [updateVendor]
  );

  /** Create the budget expense for a vendor and remember the link. */
  const addToBudget = useCallback(
    (vendor) => {
      if (!vendor || !weddingId) return null;
      const expense = addExpense(vendorToExpenseDraft(vendor, weddingId));
      if (expense) updateVendor(vendor.id, { expenseId: expense.id });
      return expense;
    },
    [addExpense, updateVendor, weddingId]
  );

  return {
    vendors,
    allVendors,
    summary,
    wedding,
    currency: wedding?.currency ?? 'USD',
    createVendor,
    saveVendor,
    removeVendor: deleteVendor,
    setStatus,
    togglePaymentPaid,
    addToBudget,
  };
}
