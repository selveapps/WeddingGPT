import React, { useMemo, useState } from 'react';
import { Alert, Pressable, TextInput, View } from 'react-native';
import { Screen, Stack, Row, Text, Card, ScreenHeader, SectionHeader, Button, Badge, Divider } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { createId, usePersistentList } from '@/features/shared/persistentList';
import { formatINR, normalizePayment, summarizePayments } from './vendorPaymentModel';

const KEY = 'feature:vendor-payments:v1';
const blank = { name: '', total: '', paid: '', dueDate: '', note: '' };

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default' }) {
  const { colors, radii, spacing, typography } = useTheme();
  return (
    <Stack gap="xs">
      <Text variant="label" color="muted">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        placeholderTextColor={colors.inkSubtle}
        style={{ color: colors.ink, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radii.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: typography.body?.fontSize ?? 15 }}
      />
    </Stack>
  );
}

export default function VendorPaymentsScreen() {
  const { colors, spacing } = useTheme();
  const { items, add, update, remove, loaded } = usePersistentList(KEY, []);
  const [form, setForm] = useState(blank);
  const [showForm, setShowForm] = useState(false);
  const summary = useMemo(() => summarizePayments(items), [items]);
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const save = () => {
    try {
      const payment = normalizePayment(form);
      add({ ...payment, id: createId('payment'), createdAt: new Date().toISOString() });
      setForm(blank);
      setShowForm(false);
    } catch (error) {
      Alert.alert('Check the details', error.message);
    }
  };

  const recordPayment = (item) => {
    const left = Math.max(0, Number(item.total) - Number(item.paid));
    if (!left) return;
    Alert.prompt?.('Record payment', `Remaining ${formatINR(left)}. Enter the new total paid so far.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Save', onPress: (value) => {
        const paid = Math.min(Number(value) || 0, Number(item.total));
        update(item.id, { paid, status: paid >= Number(item.total) ? 'Paid' : paid > 0 ? 'Part-paid' : 'Planned' });
      } },
    ], 'plain-text', String(item.paid));
    if (!Alert.prompt) Alert.alert('Record payment', 'Use Edit payment amount from the vendor card in the next release.');
  };

  return (
    <Screen>
      <Stack gap="lg">
        <ScreenHeader eyebrow="Wedding finances" title="Vendor payments" />
        <Text variant="body" color="muted">Keep deposits, instalments and final balances in one place. Your records stay on this device.</Text>
        <Card tone="brand">
          <Stack gap="md">
            <Text variant="eyebrow" color="muted">TOTAL COMMITTED</Text>
            <Text variant="h2" heading>{formatINR(summary.total)}</Text>
            <Row gap="sm">
              <View style={{ flex: 1 }}><Text variant="caption" color="muted">Paid</Text><Text variant="h4">{formatINR(summary.paid)}</Text></View>
              <View style={{ flex: 1 }}><Text variant="caption" color="muted">Remaining</Text><Text variant="h4">{formatINR(summary.remaining)}</Text></View>
            </Row>
            <Text variant="caption" color="muted">{summary.outstandingCount} vendor payment{summary.outstandingCount === 1 ? '' : 's'} outstanding</Text>
          </Stack>
        </Card>
        <Button label={showForm ? 'Close form' : 'Add vendor payment'} onPress={() => setShowForm((value) => !value)} />
        {showForm ? (
          <Card>
            <Stack gap="md">
              <SectionHeader title="New payment" />
              <Field label="Vendor / service" value={form.name} onChangeText={(v) => set('name', v)} placeholder="Photographer, venue…" />
              <Row gap="sm">
                <View style={{ flex: 1 }}><Field label="Total (₹)" value={form.total} onChangeText={(v) => set('total', v)} placeholder="50000" keyboardType="decimal-pad" /></View>
                <View style={{ flex: 1 }}><Field label="Paid so far (₹)" value={form.paid} onChangeText={(v) => set('paid', v)} placeholder="10000" keyboardType="decimal-pad" /></View>
              </Row>
              <Field label="Next due date (optional)" value={form.dueDate} onChangeText={(v) => set('dueDate', v)} placeholder="YYYY-MM-DD" />
              <Field label="Notes (optional)" value={form.note} onChangeText={(v) => set('note', v)} placeholder="Deposit, contract details…" />
              <Button label="Save payment" onPress={save} />
            </Stack>
          </Card>
        ) : null}
        <SectionHeader title="Your vendors" trailing={String(items.length)} />
        {!loaded ? <Text color="muted">Loading saved payments…</Text> : null}
        {loaded && items.length === 0 ? <Card><Text color="muted">No vendor payments yet. Add your venue, photographer, caterer or other booking.</Text></Card> : null}
        {items.map((item) => {
          const left = Math.max(0, Number(item.total) - Number(item.paid));
          return (
            <Card key={item.id}>
              <Stack gap="sm">
                <Row align="center" gap="sm">
                  <View style={{ flex: 1 }}><Text variant="h4">{item.name}</Text><Text variant="caption" color="muted">{item.dueDate ? `Next due: ${item.dueDate}` : 'No due date set'}</Text></View>
                  <Badge label={item.status} tone={item.status === 'Paid' ? 'success' : item.status === 'Part-paid' ? 'warning' : 'neutral'} />
                </Row>
                <Row gap="sm">
                  <View style={{ flex: 1 }}><Text variant="caption" color="muted">Paid</Text><Text>{formatINR(item.paid)}</Text></View>
                  <View style={{ flex: 1 }}><Text variant="caption" color="muted">Balance</Text><Text>{formatINR(left)}</Text></View>
                </Row>
                <View style={{ height: 5, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' }}><View style={{ height: 5, width: `${item.total ? Math.min(100, (item.paid / item.total) * 100) : 0}%`, backgroundColor: colors.brand }} /></View>
                {item.note ? <Text variant="caption" color="muted">{item.note}</Text> : null}
                <Divider />
                <Row gap="sm">
                  <View style={{ flex: 1 }}><Button size="sm" variant="secondary" label="Record payment" onPress={() => recordPayment(item)} /></View>
                  <Button size="sm" variant="ghost" label="Delete" onPress={() => Alert.alert('Delete payment?', `Remove ${item.name}?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => remove(item.id) }])} />
                </Row>
              </Stack>
            </Card>
          );
        })}
      </Stack>
    </Screen>
  );
}
