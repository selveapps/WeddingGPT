/**
 * VendorPaymentsScreen — payment schedule, overdue, mark paid, CSV export.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Share, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Screen, Stack, Row, Text, Card, Button, Badge, ScreenHeader, SectionHeader,
  TextField, ListRow, useToast,
} from '@/design-system/components';
import { storage } from '@/services/storage';
import {
  VENDOR_PAYMENTS_KEY, emptyPaymentsState, normalisePaymentsState, createPayment,
  paymentsSummary, deriveStatus, markPaid, sortPayments, filterPayments,
  formatMoney, paymentReminders, exportPaymentsCsv, seedSamplePayments,
  PaymentStatus, PaymentKind,
} from './vendorPaymentModel';

const STATUS_TONE = {
  [PaymentStatus.PAID]: 'success',
  [PaymentStatus.OVERDUE]: 'danger',
  [PaymentStatus.DUE]: 'warning',
  [PaymentStatus.PLANNED]: 'neutral',
  [PaymentStatus.CANCELLED]: 'neutral',
};

export function VendorPaymentsScreen() {
  const router = useRouter();
  const toast = useToast();
  const [state, setState] = useState(emptyPaymentsState);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [form, setForm] = useState(null);

  useEffect(() => {
    let a = true;
    storage.get(VENDOR_PAYMENTS_KEY).then((raw) => {
      if (a) setState(normalisePaymentsState(raw));
    }).finally(() => { if (a) setLoaded(true); });
    return () => { a = false; };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    storage.set(VENDOR_PAYMENTS_KEY, { ...state, updatedAt: new Date().toISOString() }).catch(() => {});
  }, [state, loaded]);

  const summary = useMemo(() => paymentsSummary(state.items, state.currency), [state.items, state.currency]);
  const reminders = useMemo(() => paymentReminders(state.items), [state.items]);
  const visible = useMemo(
    () => sortPayments(filterPayments(state.items, { status: statusFilter, query })),
    [state.items, statusFilter, query]
  );

  const saveForm = useCallback(() => {
    if (!form?.vendorName?.trim() && !form?.title?.trim()) {
      toast.error('Add vendor or title');
      return;
    }
    setState((s) => {
      const exists = s.items.some((i) => i.id === form.id);
      const items = exists ? s.items.map((i) => (i.id === form.id ? form : i)) : [...s.items, form];
      return { ...s, items };
    });
    setForm(null);
    toast.success('Payment saved');
  }, [form, toast]);

  const onMarkPaid = useCallback((id) => {
    setState((s) => ({
      ...s,
      items: s.items.map((i) => (i.id === id ? markPaid(i) : i)),
    }));
    toast.success('Marked paid');
  }, [toast]);

  const remove = useCallback((id) => {
    setState((s) => ({ ...s, items: s.items.filter((i) => i.id !== id) }));
  }, []);

  const onExport = useCallback(async () => {
    try {
      await Share.share({ message: exportPaymentsCsv(state.items), title: 'Vendor payments' });
    } catch { toast.error('Share failed'); }
  }, [state.items, toast]);

  return (
    <Screen testID="vendor-payments" edges={['top', 'bottom']}>
      <ScreenHeader
        title="Vendor payments"
        subtitle="Deposits, balances and due dates"
        onBack={() => router.back()}
        trailing={<Button variant="ghost" size="sm" label="CSV" onPress={onExport} />}
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <Stack gap="md">
          <Card>
            <Stack gap="sm">
              <Row style={styles.between}>
                <Text color="muted">Still to pay</Text>
                <Text variant="label">{formatMoney(summary.planned, summary.currency)}</Text>
              </Row>
              <Row style={styles.between}>
                <Text color="muted">Paid</Text>
                <Text>{formatMoney(summary.paid, summary.currency)}</Text>
              </Row>
              <Row style={styles.between}>
                <Text color="muted">Overdue</Text>
                <Text color={summary.overdue ? 'danger' : 'ink'}>
                  {formatMoney(summary.overdue, summary.currency)}
                </Text>
              </Row>
              {summary.dueSoon > 0 ? (
                <Badge label={`${summary.dueSoon} due within 7 days`} tone="warning" />
              ) : null}
            </Stack>
          </Card>

          {reminders.length ? (
            <Card>
              <Stack gap="xs">
                <Text variant="label">Reminders</Text>
                {reminders.map((r) => (
                  <Text key={r.id} variant="caption">
                    · {r.vendorName || r.title} due {r.dueDate}
                  </Text>
                ))}
              </Stack>
            </Card>
          ) : null}

          <TextField value={query} onChangeText={setQuery} placeholder="Search vendor or title…" autoCapitalize="none" />

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Row gap="sm">
              <Button size="sm" variant={!statusFilter ? 'primary' : 'secondary'} label="All" onPress={() => setStatusFilter(null)} />
              {Object.values(PaymentStatus).map((st) => (
                <Button key={st} size="sm" variant={statusFilter === st ? 'primary' : 'secondary'} label={st} onPress={() => setStatusFilter(st)} />
              ))}
            </Row>
          </ScrollView>

          <Row gap="sm">
            <Button label="Add payment" onPress={() => setForm(createPayment({ kind: PaymentKind.DEPOSIT }))} />
            <Button variant="secondary" label="Sample rows" onPress={() => setState((s) => ({ ...s, items: [...s.items, ...seedSamplePayments()] }))} />
          </Row>

          {form ? (
            <Card>
              <Stack gap="md">
                <TextField label="Vendor" value={form.vendorName} onChangeText={(v) => setForm((f) => ({ ...f, vendorName: v }))} />
                <TextField label="Title" value={form.title} onChangeText={(v) => setForm((f) => ({ ...f, title: v }))} />
                <TextField label="Kind (deposit/balance/…)" value={form.kind} onChangeText={(v) => setForm((f) => ({ ...f, kind: v }))} />
                <TextField label="Amount" value={String(form.amount)} onChangeText={(v) => setForm((f) => ({ ...f, amount: v }))} keyboardType="decimal-pad" />
                <TextField label="Paid amount" value={String(form.paidAmount)} onChangeText={(v) => setForm((f) => ({ ...f, paidAmount: v }))} keyboardType="decimal-pad" />
                <TextField label="Due date" value={form.dueDate} onChangeText={(v) => setForm((f) => ({ ...f, dueDate: v }))} placeholder="YYYY-MM-DD" />
                <TextField label="Method" value={form.method} onChangeText={(v) => setForm((f) => ({ ...f, method: v }))} placeholder="UPI, card, bank…" />
                <TextField label="Reference" value={form.reference} onChangeText={(v) => setForm((f) => ({ ...f, reference: v }))} />
                <TextField label="Notes" value={form.notes} onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))} multiline />
                <Row gap="sm">
                  <Button label="Save" onPress={saveForm} />
                  <Button variant="secondary" label="Cancel" onPress={() => setForm(null)} />
                </Row>
              </Stack>
            </Card>
          ) : null}

          {visible.map((item) => {
            const st = deriveStatus(item);
            return (
              <Card key={item.id}>
                <Stack gap="xs">
                  <Row style={styles.between}>
                    <Text variant="label">{item.vendorName || item.title || 'Payment'}</Text>
                    <Badge label={st} tone={STATUS_TONE[st] || 'neutral'} />
                  </Row>
                  <Text variant="caption" color="muted">
                    {item.title} · {item.kind} · due {item.dueDate || '—'}
                  </Text>
                  <Text>
                    {formatMoney(item.amount, state.currency)}
                    {item.paidAmount ? ` · paid ${formatMoney(item.paidAmount, state.currency)}` : ''}
                  </Text>
                  <Row gap="sm">
                    {st !== PaymentStatus.PAID ? (
                      <Button size="sm" label="Mark paid" onPress={() => onMarkPaid(item.id)} />
                    ) : null}
                    <Button size="sm" variant="secondary" label="Edit" onPress={() => setForm({ ...item })} />
                    <Button size="sm" variant="ghost" label="Delete" onPress={() => remove(item.id)} />
                  </Row>
                </Stack>
              </Card>
            );
          })}
          {!visible.length && loaded ? <Text color="muted">No payments yet.</Text> : null}
        </Stack>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});

export default VendorPaymentsScreen;
