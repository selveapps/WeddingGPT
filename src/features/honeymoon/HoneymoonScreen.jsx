import React, { useMemo, useState } from 'react';
import { Alert, TextInput, View } from 'react-native';
import { Screen, Stack, Row, Text, Card, ScreenHeader, SectionHeader, Button, Badge, Divider } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { createId, usePersistentList } from '@/features/shared/persistentList';
import { groupExpenses, summarizeTrip, validateExpense } from './honeymoonModel';

const TRIP_KEY = 'feature:honeymoon:details:v1';
const EXPENSE_KEY = 'feature:honeymoon:expenses:v1';
function Input({ label, value, onChangeText, placeholder, keyboardType = 'default' }) {
  const { colors, spacing } = useTheme();
  return <Stack gap="xs"><Text variant="label" color="muted">{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} placeholder={placeholder} keyboardType={keyboardType} placeholderTextColor={colors.inkSubtle} style={{ color: colors.ink, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }} /></Stack>;
}
export default function HoneymoonScreen() {
  const { colors } = useTheme();
  const { items: expenses, add, remove, loaded } = usePersistentList(EXPENSE_KEY, []);
  const [details, setDetails] = useState({ destination: '', departure: '', returnDate: '', budget: '' });
  const [formVisible, setFormVisible] = useState(false);
  const [expense, setExpense] = useState({ title: '', amount: '', category: 'Travel' });
  const summary = useMemo(() => summarizeTrip({ ...details, expenses }), [details, expenses]);
  const categories = useMemo(() => groupExpenses(expenses), [expenses]);
  const update = (key, value) => setDetails((current) => ({ ...current, [key]: value }));
  const saveExpense = () => {
    try {
      add({ ...validateExpense(expense), id: createId('trip-expense'), createdAt: new Date().toISOString() });
      setExpense({ title: '', amount: '', category: 'Travel' });
      setFormVisible(false);
    } catch (error) { Alert.alert('Check expense', error.message); }
  };
  return (
    <Screen>
      <Stack gap="lg">
        <ScreenHeader eyebrow="After the wedding" title="Honeymoon planner" />
        <Text color="muted">Keep destination details, travel dates and trip spending together.</Text>
        <Card tone="brand"><Stack gap="md"><Text variant="eyebrow" color="muted">TRIP BUDGET</Text><Text variant="h2" heading>{summary.budget.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}</Text><Row gap="sm"><View style={{ flex: 1 }}><Text variant="caption" color="muted">Spent</Text><Text variant="h4">₹{summary.spent.toLocaleString('en-IN')}</Text></View><View style={{ flex: 1 }}><Text variant="caption" color="muted">Remaining</Text><Text variant="h4">₹{summary.remaining.toLocaleString('en-IN')}</Text></View></Row>{summary.overBudget ? <Badge label="Over budget" tone="warning" /> : null}</Stack></Card>
        <Card><Stack gap="md"><SectionHeader title="Trip details" /><Input label="Destination" value={details.destination} onChangeText={(v) => update('destination', v)} placeholder="e.g. Bali, Japan, Kerala" /><Row gap="sm"><View style={{ flex: 1 }}><Input label="Departure" value={details.departure} onChangeText={(v) => update('departure', v)} placeholder="YYYY-MM-DD" /></View><View style={{ flex: 1 }}><Input label="Return" value={details.returnDate} onChangeText={(v) => update('returnDate', v)} placeholder="YYYY-MM-DD" /></View></Row><Input label="Total budget (₹)" value={details.budget} onChangeText={(v) => update('budget', v)} placeholder="150000" keyboardType="decimal-pad" /><Text variant="caption" color="muted">Trip details remain in this screen while it is open. Expense items are saved locally on this device.</Text></Stack></Card>
        <Row align="center"><View style={{ flex: 1 }}><SectionHeader title="Trip expenses" /></View><Button size="sm" label={formVisible ? 'Cancel' : 'Add expense'} onPress={() => setFormVisible((v) => !v)} /></Row>
        {formVisible ? <Card><Stack gap="md"><Input label="Expense" value={expense.title} onChangeText={(v) => setExpense((e) => ({ ...e, title: v }))} placeholder="Flights, hotel, activities…" /><Row gap="sm"><View style={{ flex: 1 }}><Input label="Amount (₹)" value={expense.amount} onChangeText={(v) => setExpense((e) => ({ ...e, amount: v }))} placeholder="25000" keyboardType="decimal-pad" /></View><View style={{ flex: 1 }}><Input label="Category" value={expense.category} onChangeText={(v) => setExpense((e) => ({ ...e, category: v }))} placeholder="Travel" /></View></Row><Button label="Save expense" onPress={saveExpense} /></Stack></Card> : null}
        {Object.keys(categories).length > 0 ? <Card><Stack gap="sm"><Text variant="h4">By category</Text>{Object.entries(categories).map(([category, amount]) => <Row key={category} align="center"><Text style={{ flex: 1 }}>{category}</Text><Text>{`₹${amount.toLocaleString('en-IN')}`}</Text></Row>)}</Stack></Card> : null}
        {!loaded ? <Text color="muted">Loading expenses…</Text> : null}
        {expenses.length === 0 ? <Card><Text color="muted">No trip expenses yet. Add flights, accommodation, meals or activities to track your spend.</Text></Card> : expenses.map((item) => <Card key={item.id}><Row align="center" gap="sm"><View style={{ flex: 1 }}><Text variant="h4">{item.title}</Text><Text variant="caption" color="muted">{item.category}</Text></View><Text variant="h4">₹{Number(item.amount).toLocaleString('en-IN')}</Text><Button size="sm" variant="ghost" label="Remove" onPress={() => Alert.alert('Remove expense?', item.title, [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: () => remove(item.id) }])} /></Row></Card>)}
        <Divider /><Text variant="caption" color="muted">Tip: confirm passport validity, entry requirements, travel insurance and cancellation policies directly with official providers before booking.</Text>
      </Stack>
    </Screen>
  );
}
