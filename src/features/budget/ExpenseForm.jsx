import React, { useMemo, useState } from 'react';

import {
  Stack,
  Row,
  Text,
  TextField,
  Chip,
  Button,
  SectionHeader,
} from '@/design-system/components';
import {
  PaymentStatus,
  PAYMENT_STATUS_META,
  ExpenseCommitment,
} from '@/models';
import { rules, validate } from '@/lib/validation';
import { DateField } from '@/features/shared/DateField';
import { MoneyField } from '@/features/shared/MoneyField';

/**
 * The add/edit form for an expense.
 *
 * "Committed" is asked as a plain question rather than left to the payment
 * status, because the two are genuinely independent: a signed contract you have
 * not paid a rupee on is committed money, and a casual estimate you already
 * paid a deposit against is not. `summariseBudget` relies on that distinction
 * to produce a remaining figure the couple can act on.
 */
export function ExpenseForm({
  initial,
  categories = [],
  currency,
  submitLabel = 'Save',
  onSubmit,
  onCancel,
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [vendorName, setVendorName] = useState(initial?.vendorName ?? '');
  const [amount, setAmount] = useState(initial?.amount ?? null);
  const [paidAmount, setPaidAmount] = useState(initial?.paidAmount ?? null);
  const [budgetCategoryId, setBudgetCategoryId] = useState(initial?.budgetCategoryId ?? null);
  const [commitment, setCommitment] = useState(initial?.commitment ?? ExpenseCommitment.ESTIMATED);
  const [paymentStatus, setPaymentStatus] = useState(initial?.paymentStatus ?? PaymentStatus.UNPAID);
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? null);
  const [date, setDate] = useState(initial?.date ?? null);
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [errors, setErrors] = useState({});

  const titleRules = useMemo(
    () => [rules.required('A description'), rules.maxLength(120, 'The description')],
    []
  );

  const submit = () => {
    const nextErrors = {};

    const titleError = validate(title, titleRules);
    if (titleError) nextErrors.title = titleError;

    if (amount === null || amount === undefined) {
      nextErrors.amount = 'How much is it?';
    } else if (amount < 0) {
      nextErrors.amount = 'An amount cannot be negative.';
    }

    if ((paidAmount ?? 0) > (amount ?? 0)) {
      nextErrors.paidAmount = 'Paid cannot be more than the total.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});

    const paid = paidAmount ?? 0;
    // Keep the status honest with the numbers rather than trusting whichever
    // chip happens to be selected - the amounts are the source of truth.
    const derivedStatus =
      paid >= (amount ?? 0) && paid > 0
        ? PaymentStatus.PAID
        : paid > 0
          ? PaymentStatus.PARTIALLY_PAID
          : paymentStatus === PaymentStatus.PAID || paymentStatus === PaymentStatus.PARTIALLY_PAID
            ? PaymentStatus.UNPAID
            : paymentStatus;

    onSubmit({
      title: title.trim(),
      vendorName: vendorName.trim(),
      amount: amount ?? 0,
      paidAmount: paid,
      budgetCategoryId,
      commitment,
      paymentStatus: derivedStatus,
      dueDate,
      date,
      notes: notes.trim(),
    });
  };

  return (
    <Stack gap="lg">
      <Stack gap="md">
        <TextField
          label="What is it?"
          value={title}
          onChangeText={(next) => {
            setTitle(next);
            if (errors.title) setErrors((e) => ({ ...e, title: undefined }));
          }}
          placeholder="Venue deposit"
          error={errors.title}
          autoCapitalize="sentences"
          autoFocus={!initial}
          required
        />

        <TextField
          label="Who is it to?"
          value={vendorName}
          onChangeText={setVendorName}
          placeholder="Vendor or supplier name"
          autoCapitalize="words"
        />

        <MoneyField
          label="Total amount"
          value={amount}
          onChange={(next) => {
            setAmount(next);
            if (errors.amount) setErrors((e) => ({ ...e, amount: undefined }));
          }}
          currency={currency}
          error={errors.amount}
          required
        />

        <MoneyField
          label="Paid so far"
          value={paidAmount}
          onChange={(next) => {
            setPaidAmount(next);
            if (errors.paidAmount) setErrors((e) => ({ ...e, paidAmount: undefined }));
          }}
          currency={currency}
          error={errors.paidAmount}
          helper="Leave empty if nothing has changed hands yet."
        />
      </Stack>

      {categories.length > 0 ? (
        <Stack gap="xs">
          <SectionHeader eyebrow="Where it belongs" title="Category" />
          <Row gap="xs" wrap align="flex-start">
            <Chip
              label="Uncategorised"
              size="sm"
              selected={budgetCategoryId === null}
              onPress={() => setBudgetCategoryId(null)}
            />
            {categories.map((category) => (
              <Chip
                key={category.id}
                label={category.name}
                size="sm"
                selected={budgetCategoryId === category.id}
                onPress={() => setBudgetCategoryId(category.id)}
              />
            ))}
          </Row>
        </Stack>
      ) : null}

      <Stack gap="xs">
        <SectionHeader
          eyebrow="How firm is it"
          title="Committed or estimated"
          subtitle="Committed money is contractually owed. Estimates inform the plan without reducing what you can still allocate."
        />
        <Row gap="xs" wrap align="flex-start">
          <Chip
            label="Just an estimate"
            selected={commitment === ExpenseCommitment.ESTIMATED}
            onPress={() => setCommitment(ExpenseCommitment.ESTIMATED)}
          />
          <Chip
            label="Committed"
            selected={commitment === ExpenseCommitment.COMMITTED}
            onPress={() => setCommitment(ExpenseCommitment.COMMITTED)}
          />
        </Row>
      </Stack>

      <Stack gap="xs">
        <SectionHeader eyebrow="Payment" title="Status" />
        <Row gap="xs" wrap align="flex-start">
          {Object.entries(PAYMENT_STATUS_META).map(([value, meta]) => (
            <Chip
              key={value}
              label={meta.label}
              size="sm"
              selected={paymentStatus === value}
              onPress={() => setPaymentStatus(value)}
            />
          ))}
        </Row>
        <Text variant="caption" color="subtle">
          Paid and part-paid follow the amounts above automatically.
        </Text>
      </Stack>

      <Stack gap="xs">
        <SectionHeader eyebrow="Dates" title="When" />
        <DateField label="Payment due" value={dueDate} onChange={setDueDate} />
        <DateField label="Date paid" value={date} onChange={setDate} icon="check" />
      </Stack>

      <Stack gap="xs">
        <SectionHeader eyebrow="Anything else" title="Notes" />
        <TextField
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Invoice number, what the quote covers, what it does not."
          multiline
          numberOfLines={3}
          autoCapitalize="sentences"
        />
      </Stack>

      <Stack gap="xs">
        <Button label={submitLabel} onPress={submit} />
        {onCancel ? <Button label="Cancel" variant="ghost" onPress={onCancel} /> : null}
      </Stack>
    </Stack>
  );
}

export default ExpenseForm;
