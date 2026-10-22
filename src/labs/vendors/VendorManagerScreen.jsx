import React, { useMemo, useState } from 'react';

import {
  Stack,
  Row,
  Text,
  Card,
  Badge,
  Chip,
  Button,
  TextField,
  ListRow,
  SectionHeader,
  BottomSheet,
  ConfirmSheet,
  EmptyState,
  useToast,
} from '@/design-system/components';
import {
  VendorStatus,
  VENDOR_STATUS_META,
  VENDOR_CATEGORIES,
} from '@/models';
import { formatMoney, parseMoneyInput } from '@/lib/currency';
import { formatMediumDate } from '@/lib/date';
import { useWeddingStore, useBudgetStore, selectWedding } from '@/store';

import { LabScreen } from '../shared/LabScreen';
import { selectItems } from '../shared/createCollectionStore';
import { useLabVendorStore } from './store';
import {
  CLOSED_STATUSES,
  buildPaymentSchedule,
  categoryName,
  defaultBalanceDue,
  nextStatus,
  paymentTotals,
  summariseVendorPipeline,
  toExpenseDraft,
  upcomingPayments,
} from './model';

export default function VendorManagerScreen() {
  const toast = useToast();
  const wedding = useWeddingStore(selectWedding);
  const addExpense = useBudgetStore((state) => state.addExpense);

  const vendors = useLabVendorStore(selectItems);
  const { add, advance, setStatus, togglePaid, update, remove } = useLabVendorStore.getState();

  const [adding, setAdding] = useState(false);
  const [toBudget, setToBudget] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const summary = useMemo(() => summariseVendorPipeline(vendors), [vendors]);
  const payments = useMemo(() => upcomingPayments(vendors), [vendors]);

  const sendToBudget = () => {
    const vendor = toBudget;
    setToBudget(null);
    if (!vendor || !wedding) return;
    const expense = addExpense(toExpenseDraft(vendor, wedding.id));
    update(vendor.id, { expenseId: expense?.id ?? null });
    toast.success(`${vendor.name} added to your budget`);
  };

  return (
    <LabScreen
      title="Vendor manager"
      intro="Move each vendor from saved to booked and track what you still owe. Vendors here are separate from your real list."
    >
      <Card tone="brand">
        <Stack gap="sm">
          <Text variant="h3">
            {summary.booked} of {summary.total} booked
          </Text>
          <Row justify="space-between">
            <Stat label="Contracted" value={formatMoney(summary.contracted)} />
            <Stat label="Paid" value={formatMoney(summary.paid)} />
            <Stat label="Still owed" value={formatMoney(summary.outstanding)} />
          </Row>
        </Stack>
      </Card>

      <Button label="Add a vendor" iconLeft="plus" variant="secondary" onPress={() => setAdding(true)} />

      {payments.length > 0 ? (
        <Stack gap="sm">
          <SectionHeader title="Coming up to pay" />
          <Card padding="none">
            {payments.map((payment) => (
              <ListRow
                key={payment.id}
                title={`${payment.label} - ${payment.vendorName}`}
                subtitle={payment.dueDate ? `Due ${formatMediumDate(payment.dueDate)}` : 'No due date'}
                meta={formatMoney(payment.amount)}
                trailing={payment.overdue ? <Badge label="Overdue" tone="danger" /> : null}
                onPress={() => togglePaid(payment.vendorId, payment.id)}
                accessibilityHint="Marks this payment as paid"
                showChevron={false}
              />
            ))}
          </Card>
          <Text variant="caption" color="subtle">
            Tap a payment to mark it paid.
          </Text>
        </Stack>
      ) : null}

      <Stack gap="sm">
        <SectionHeader title="Your vendors" />
        {vendors.length === 0 ? (
          <EmptyState
            compact
            icon="vendors"
            title="No vendors yet"
            message="Add the first one you are talking to - even if it is just a name."
          />
        ) : (
          vendors.map((vendor) => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              onAdvance={() => advance(vendor.id)}
              onClose={() => setStatus(vendor.id, VendorStatus.PASSED)}
              onTogglePaid={(paymentId) => togglePaid(vendor.id, paymentId)}
              onSendToBudget={() => setToBudget(vendor)}
              onDelete={() => setToDelete(vendor)}
            />
          ))
        )}
      </Stack>

      <AddVendorSheet
        visible={adding}
        onClose={() => setAdding(false)}
        weddingDate={wedding?.date ?? null}
        onSave={(fields) => {
          add(fields);
          setAdding(false);
          toast.success(`${fields.name} saved`);
        }}
      />

      <ConfirmSheet
        visible={Boolean(toBudget)}
        onClose={() => setToBudget(null)}
        onConfirm={sendToBudget}
        title="Add to your real budget?"
        message={
          toBudget
            ? `This creates a ${formatMoney(paymentTotals(toBudget).total)} expense for ${toBudget.name} in your Budget tab.`
            : ''
        }
        confirmLabel="Add expense"
      />

      <ConfirmSheet
        visible={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          remove(toDelete.id);
          setToDelete(null);
        }}
        title="Remove this vendor?"
        message={toDelete ? `${toDelete.name} and its payments will be removed from Labs.` : ''}
        confirmLabel="Remove"
        destructive
      />
    </LabScreen>
  );
}

function Stat({ label, value }) {
  return (
    <Stack gap="hair">
      <Text variant="caption" color="muted">
        {label}
      </Text>
      <Text variant="bodyStrong">{value}</Text>
    </Stack>
  );
}

function VendorCard({ vendor, onAdvance, onClose, onTogglePaid, onSendToBudget, onDelete }) {
  const meta = VENDOR_STATUS_META[vendor.status];
  const next = nextStatus(vendor.status);
  const closed = CLOSED_STATUSES.includes(vendor.status);
  const totals = paymentTotals(vendor);

  return (
    <Card onLongPress={onDelete} accessibilityHint="Long press to remove">
      <Stack gap="sm">
        <Row justify="space-between" align="flex-start">
          <Stack gap="hair" style={{ flex: 1 }}>
            <Text variant="bodyStrong">{vendor.name}</Text>
            <Text variant="caption" color="muted">
              {categoryName(vendor.categoryKey)}
              {totals.total > 0 ? ` - ${formatMoney(totals.total)}` : ''}
            </Text>
          </Stack>
          <Badge label={meta?.label ?? vendor.status} tone={meta?.tone ?? 'neutral'} />
        </Row>

        {vendor.status === VendorStatus.BOOKED && (vendor.payments ?? []).length > 0 ? (
          <Row gap="xs" wrap>
            {vendor.payments.map((payment) => (
              <Chip
                key={payment.id}
                size="sm"
                icon={payment.paidAt ? 'check' : undefined}
                selected={Boolean(payment.paidAt)}
                label={`${payment.label} ${formatMoney(payment.amount)}`}
                onPress={() => onTogglePaid(payment.id)}
              />
            ))}
          </Row>
        ) : null}

        <Row gap="xs" wrap>
          {next !== vendor.status ? (
            <Button
              size="sm"
              variant="soft"
              fullWidth={false}
              label={`Mark ${VENDOR_STATUS_META[next].label.toLowerCase()}`}
              onPress={onAdvance}
            />
          ) : null}
          {!closed && vendor.status !== VendorStatus.BOOKED ? (
            <Button size="sm" variant="ghost" fullWidth={false} label="We passed" onPress={onClose} />
          ) : null}
          {vendor.status === VendorStatus.BOOKED && !vendor.expenseId && totals.total > 0 ? (
            <Button
              size="sm"
              variant="ghost"
              fullWidth={false}
              iconLeft="budget"
              label="Send to budget"
              onPress={onSendToBudget}
            />
          ) : null}
        </Row>
      </Stack>
    </Card>
  );
}

function AddVendorSheet({ visible, onClose, onSave, weddingDate }) {
  const [name, setName] = useState('');
  const [categoryKey, setCategoryKey] = useState('venue');
  const [total, setTotal] = useState('');
  const [deposit, setDeposit] = useState('30');

  const save = () => {
    const contractTotal = parseMoneyInput(total) ?? 0;
    onSave({
      name: name.trim(),
      categoryKey,
      status: VendorStatus.SAVED,
      contractTotal,
      payments: buildPaymentSchedule({
        total: contractTotal,
        depositPercent: Number(deposit),
        balanceDue: defaultBalanceDue(weddingDate),
      }),
      expenseId: null,
      bookedAt: null,
    });
    setName('');
    setTotal('');
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Add a vendor"
      footer={<Button label="Save vendor" onPress={save} disabled={!name.trim()} />}
    >
      <Stack gap="lg">
        <TextField label="Name" value={name} onChangeText={setName} placeholder="Rosewood Florals" required />
        <Stack gap="xs">
          <Text variant="label">Category</Text>
          <Row gap="xs" wrap>
            {VENDOR_CATEGORIES.map((category) => (
              <Chip
                key={category.key}
                size="sm"
                label={category.name}
                selected={categoryKey === category.key}
                onPress={() => setCategoryKey(category.key)}
              />
            ))}
          </Row>
        </Stack>
        <TextField
          label="Contract total"
          value={total}
          onChangeText={setTotal}
          prefix="$"
          keyboardType="decimal-pad"
          helper="Leave empty if you do not have a quote yet."
        />
        <TextField
          label="Deposit"
          value={deposit}
          onChangeText={setDeposit}
          suffix="%"
          keyboardType="number-pad"
          helper="The balance is set two weeks before the wedding."
        />
      </Stack>
    </BottomSheet>
  );
}
