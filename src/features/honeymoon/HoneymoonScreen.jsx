/**
 * HoneymoonScreen — full trip planner: details, itinerary, bookings, expenses, packing.
 * Replaces the thin tools/honeymoon stub with a multi-section workspace.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Share } from 'react-native';
import { useRouter } from 'expo-router';

import {
  Screen,
  Stack,
  Row,
  Text,
  Card,
  Button,
  Badge,
  ScreenHeader,
  SectionHeader,
  TextField,
  ListRow,
  ConfirmSheet,
  useToast,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { storage } from '@/services/storage';

import {
  HONEYMOON_STORAGE_KEY,
  emptyHoneymoonState,
  normaliseHoneymoonState,
  budgetSummary,
  expensesByCategory,
  packingProgress,
  createItineraryDay,
  createBooking,
  createExpense,
  createIdea,
  createId,
  generateStarterItinerary,
  tripDayCount,
  formatMoney,
  sortBookingsByDate,
  honeymoonCompleteness,
  exportHoneymoonSummary,
  ideaSuggestions,
  EXPENSE_CATEGORIES,
  BOOKING_TYPE_META,
  BookingType,
  validateDetails,
} from './honeymoonModel';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'itinerary', label: 'Itinerary' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'money', label: 'Money' },
  { id: 'packing', label: 'Packing' },
];

export function HoneymoonScreen() {
  const router = useRouter();
  const toast = useToast();
  const { colors, spacing } = useTheme();
  const [state, setState] = useState(emptyHoneymoonState);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState('overview');
  const [bookingForm, setBookingForm] = useState(null);
  const [expenseForm, setExpenseForm] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    let active = true;
    storage
      .get(HONEYMOON_STORAGE_KEY)
      .then((raw) => {
        if (active) setState(normaliseHoneymoonState(raw));
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const next = { ...state, updatedAt: new Date().toISOString() };
    storage.set(HONEYMOON_STORAGE_KEY, next).catch(() => {});
  }, [state, loaded]);

  const summary = useMemo(() => budgetSummary(state), [state]);
  const byCategory = useMemo(() => expensesByCategory(state.expenses), [state.expenses]);
  const pack = useMemo(() => packingProgress(state.packing), [state.packing]);
  const complete = useMemo(() => honeymoonCompleteness(state), [state]);
  const days = tripDayCount(state.details.departure, state.details.returnDate);

  const updateDetails = useCallback((key, value) => {
    setState((s) => ({ ...s, details: { ...s.details, [key]: value } }));
  }, []);

  const generateDays = useCallback(() => {
    const errors = validateDetails(state.details);
    if (errors.returnDate) {
      toast.error(errors.returnDate);
      return;
    }
    const list = generateStarterItinerary(state.details.departure, state.details.returnDate);
    if (!list.length) {
      toast.info('Set departure and return dates first.');
      return;
    }
    setState((s) => ({ ...s, itinerary: list }));
    toast.success(`Created ${list.length} itinerary days`);
  }, [state.details, toast]);

  const updateDay = useCallback((id, patch) => {
    setState((s) => ({
      ...s,
      itinerary: s.itinerary.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    }));
  }, []);

  const addDay = useCallback(() => {
    const n = (state.itinerary?.length || 0) + 1;
    setState((s) => ({
      ...s,
      itinerary: [...s.itinerary, createItineraryDay(n)],
    }));
  }, [state.itinerary]);

  const removeDay = useCallback((id) => {
    setState((s) => ({
      ...s,
      itinerary: s.itinerary.filter((d) => d.id !== id).map((d, i) => ({ ...d, dayNumber: i + 1 })),
    }));
  }, []);

  const saveBooking = useCallback(() => {
    if (!bookingForm?.title?.trim()) {
      toast.error('Add a booking title');
      return;
    }
    setState((s) => {
      const exists = s.bookings.some((b) => b.id === bookingForm.id);
      const bookings = exists
        ? s.bookings.map((b) => (b.id === bookingForm.id ? bookingForm : b))
        : [...s.bookings, bookingForm];
      return { ...s, bookings };
    });
    setBookingForm(null);
    toast.success('Booking saved');
  }, [bookingForm, toast]);

  const removeBooking = useCallback((id) => {
    setState((s) => ({ ...s, bookings: s.bookings.filter((b) => b.id !== id) }));
  }, []);

  const saveExpense = useCallback(() => {
    if (!expenseForm?.title?.trim()) {
      toast.error('Add an expense title');
      return;
    }
    setState((s) => {
      const exists = s.expenses.some((e) => e.id === expenseForm.id);
      const expenses = exists
        ? s.expenses.map((e) => (e.id === expenseForm.id ? expenseForm : e))
        : [...s.expenses, expenseForm];
      return { ...s, expenses };
    });
    setExpenseForm(null);
    toast.success('Expense saved');
  }, [expenseForm, toast]);

  const removeExpense = useCallback((id) => {
    setState((s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== id) }));
  }, []);

  const togglePack = useCallback((id) => {
    setState((s) => ({
      ...s,
      packing: s.packing.map((p) => (p.id === id ? { ...p, done: !p.done } : p)),
    }));
  }, []);

  const addPackItem = useCallback(() => {
    setState((s) => ({
      ...s,
      packing: [
        ...s.packing,
        { id: createId('pack'), title: 'New item', category: 'Misc', done: false },
      ],
    }));
  }, []);

  const addIdeaFromSuggestion = useCallback((text) => {
    setState((s) => ({ ...s, ideas: [...s.ideas, createIdea(text)] }));
    toast.success('Idea saved');
  }, [toast]);

  const onExport = useCallback(async () => {
    try {
      const payload = exportHoneymoonSummary(state);
      await Share.share({
        message: JSON.stringify(payload, null, 2),
        title: 'Honeymoon summary',
      });
    } catch {
      toast.error('Could not share');
    }
  }, [state, toast]);

  const clearAll = useCallback(() => {
    setState(emptyHoneymoonState());
    setConfirmClear(false);
    toast.success('Honeymoon plan cleared');
  }, [toast]);

  const suggestions = useMemo(
    () => ideaSuggestions(state.details.destination, state.details.vibe),
    [state.details.destination, state.details.vibe]
  );

  return (
    <Screen testID="honeymoon-screen" edges={['top', 'bottom']}>
      <ScreenHeader
        title="Honeymoon"
        subtitle={state.details.destination || 'Plan the trip after “I do”'}
        onBack={() => router.back()}
        trailing={<Button variant="ghost" size="sm" label="Export" onPress={onExport} />}
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <Stack gap="md">
          <Card>
            <Stack gap="sm">
              <Row style={styles.between}>
                <Text variant="caption" color="muted">
                  Plan completeness
                </Text>
                <Badge label={`${complete.percent}%`} tone="brand" />
              </Row>
              <View style={[styles.barBg, { backgroundColor: colors.surfaceSunken }]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${Math.min(100, complete.percent)}%`,
                      backgroundColor: colors.brand,
                    },
                  ]}
                />
              </View>
              <Row style={styles.between}>
                <Text variant="caption" color="muted">
                  {days ? `${days} days` : 'Set dates'}
                </Text>
                <Text variant="caption" color="muted">
                  Packing {pack.done}/{pack.total}
                </Text>
              </Row>
            </Stack>
          </Card>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Row gap="sm">
              {TABS.map((t) => (
                <Button
                  key={t.id}
                  size="sm"
                  variant={tab === t.id ? 'primary' : 'secondary'}
                  label={t.label}
                  onPress={() => setTab(t.id)}
                />
              ))}
            </Row>
          </ScrollView>

          {tab === 'overview' ? (
            <Stack gap="md">
              <SectionHeader title="Trip details" />
              <Card>
                <Stack gap="md">
                  <TextField
                    label="Destination"
                    value={state.details.destination}
                    onChangeText={(v) => updateDetails('destination', v)}
                    placeholder="e.g. Bali, Kyoto, Kerala"
                  />
                  <TextField
                    label="Country / region"
                    value={state.details.country}
                    onChangeText={(v) => updateDetails('country', v)}
                  />
                  <Row gap="sm">
                    <View style={{ flex: 1 }}>
                      <TextField
                        label="Departure"
                        value={state.details.departure}
                        onChangeText={(v) => updateDetails('departure', v)}
                        placeholder="YYYY-MM-DD"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <TextField
                        label="Return"
                        value={state.details.returnDate}
                        onChangeText={(v) => updateDetails('returnDate', v)}
                        placeholder="YYYY-MM-DD"
                      />
                    </View>
                  </Row>
                  <TextField
                    label="Budget"
                    value={state.details.budget}
                    onChangeText={(v) => updateDetails('budget', v)}
                    placeholder="150000"
                    keyboardType="decimal-pad"
                  />
                  <TextField
                    label="Vibe"
                    value={state.details.vibe}
                    onChangeText={(v) => updateDetails('vibe', v)}
                    placeholder="Relax, adventure, food…"
                  />
                  <TextField
                    label="Notes"
                    value={state.details.notes}
                    onChangeText={(v) => updateDetails('notes', v)}
                    multiline
                  />
                </Stack>
              </Card>
              <Card>
                <Stack gap="sm">
                  <Text variant="label">Budget snapshot</Text>
                  <Row style={styles.between}>
                    <Text color="muted">Budget</Text>
                    <Text>{formatMoney(summary.budget, state.details.currency)}</Text>
                  </Row>
                  <Row style={styles.between}>
                    <Text color="muted">Spent + booked</Text>
                    <Text>{formatMoney(summary.totalCommitted, state.details.currency)}</Text>
                  </Row>
                  <Row style={styles.between}>
                    <Text color="muted">Remaining</Text>
                    <Text color={summary.overBudget ? 'danger' : 'ink'}>
                      {formatMoney(summary.remaining, state.details.currency)}
                    </Text>
                  </Row>
                  {summary.overBudget ? <Badge label="Over budget" tone="warning" /> : null}
                </Stack>
              </Card>
              <SectionHeader title="Idea sparks" subtitle="Tap to save to your list" />
              <Card padding="none">
                {suggestions.map((s) => (
                  <ListRow
                    key={s}
                    title={s}
                    onPress={() => addIdeaFromSuggestion(s)}
                    showChevron
                  />
                ))}
              </Card>
              {state.ideas.length ? (
                <Card>
                  <Stack gap="xs">
                    <Text variant="label">Saved ideas</Text>
                    {state.ideas.map((i) => (
                      <Text key={i.id} variant="body">
                        · {i.text}
                      </Text>
                    ))}
                  </Stack>
                </Card>
              ) : null}
              <Button
                variant="secondary"
                label="Clear entire honeymoon plan"
                onPress={() => setConfirmClear(true)}
              />
            </Stack>
          ) : null}

          {tab === 'itinerary' ? (
            <Stack gap="md">
              <Row gap="sm">
                <Button label="Generate from dates" onPress={generateDays} />
                <Button variant="secondary" label="Add day" onPress={addDay} />
              </Row>
              {!state.itinerary.length ? (
                <Card>
                  <Text color="muted">
                    Set departure/return on Overview, then generate a day-by-day skeleton.
                  </Text>
                </Card>
              ) : (
                state.itinerary.map((day) => (
                  <Card key={day.id}>
                    <Stack gap="sm">
                      <Row style={styles.between}>
                        <Text variant="label">
                          Day {day.dayNumber}
                          {day.date ? ` · ${day.date}` : ''}
                        </Text>
                        <Button
                          size="sm"
                          variant="ghost"
                          label="Remove"
                          onPress={() => removeDay(day.id)}
                        />
                      </Row>
                      <TextField
                        label="Title"
                        value={day.title}
                        onChangeText={(v) => updateDay(day.id, { title: v })}
                      />
                      <TextField
                        label="Morning"
                        value={day.morning}
                        onChangeText={(v) => updateDay(day.id, { morning: v })}
                      />
                      <TextField
                        label="Afternoon"
                        value={day.afternoon}
                        onChangeText={(v) => updateDay(day.id, { afternoon: v })}
                      />
                      <TextField
                        label="Evening"
                        value={day.evening}
                        onChangeText={(v) => updateDay(day.id, { evening: v })}
                      />
                      <TextField
                        label="Notes"
                        value={day.notes}
                        onChangeText={(v) => updateDay(day.id, { notes: v })}
                        multiline
                      />
                    </Stack>
                  </Card>
                ))
              )}
            </Stack>
          ) : null}

          {tab === 'bookings' ? (
            <Stack gap="md">
              <Button
                label="Add booking"
                onPress={() => setBookingForm(createBooking({ type: BookingType.HOTEL }))}
              />
              {bookingForm ? (
                <Card>
                  <Stack gap="md">
                    <TextField
                      label="Title"
                      value={bookingForm.title}
                      onChangeText={(v) => setBookingForm((f) => ({ ...f, title: v }))}
                    />
                    <TextField
                      label="Type (flight, hotel, …)"
                      value={bookingForm.type}
                      onChangeText={(v) => setBookingForm((f) => ({ ...f, type: v }))}
                    />
                    <TextField
                      label="Confirmation #"
                      value={bookingForm.confirmation}
                      onChangeText={(v) => setBookingForm((f) => ({ ...f, confirmation: v }))}
                    />
                    <Row gap="sm">
                      <View style={{ flex: 1 }}>
                        <TextField
                          label="Start"
                          value={bookingForm.startDate}
                          onChangeText={(v) => setBookingForm((f) => ({ ...f, startDate: v }))}
                          placeholder="YYYY-MM-DD"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <TextField
                          label="End"
                          value={bookingForm.endDate}
                          onChangeText={(v) => setBookingForm((f) => ({ ...f, endDate: v }))}
                          placeholder="YYYY-MM-DD"
                        />
                      </View>
                    </Row>
                    <TextField
                      label="Cost"
                      value={String(bookingForm.cost)}
                      onChangeText={(v) => setBookingForm((f) => ({ ...f, cost: v }))}
                      keyboardType="decimal-pad"
                    />
                    <TextField
                      label="Provider"
                      value={bookingForm.provider}
                      onChangeText={(v) => setBookingForm((f) => ({ ...f, provider: v }))}
                    />
                    <Row gap="sm">
                      <Button label="Save" onPress={saveBooking} />
                      <Button variant="secondary" label="Cancel" onPress={() => setBookingForm(null)} />
                    </Row>
                  </Stack>
                </Card>
              ) : null}
              {sortBookingsByDate(state.bookings).map((b) => (
                <Card key={b.id}>
                  <Stack gap="xs">
                    <Row style={styles.between}>
                      <Text variant="label">{b.title}</Text>
                      <Badge
                        label={BOOKING_TYPE_META[b.type]?.label || b.type}
                        tone="neutral"
                      />
                    </Row>
                    <Text variant="caption" color="muted">
                      {[b.startDate, b.endDate].filter(Boolean).join(' → ') || 'No dates'}
                      {b.confirmation ? ` · #${b.confirmation}` : ''}
                    </Text>
                    <Text>{formatMoney(b.cost, b.currency || state.details.currency)}</Text>
                    <Row gap="sm">
                      <Button size="sm" variant="secondary" label="Edit" onPress={() => setBookingForm({ ...b })} />
                      <Button size="sm" variant="ghost" label="Delete" onPress={() => removeBooking(b.id)} />
                    </Row>
                  </Stack>
                </Card>
              ))}
            </Stack>
          ) : null}

          {tab === 'money' ? (
            <Stack gap="md">
              <Button label="Add expense" onPress={() => setExpenseForm(createExpense())} />
              {expenseForm ? (
                <Card>
                  <Stack gap="md">
                    <TextField
                      label="Expense"
                      value={expenseForm.title}
                      onChangeText={(v) => setExpenseForm((f) => ({ ...f, title: v }))}
                    />
                    <TextField
                      label="Amount"
                      value={String(expenseForm.amount)}
                      onChangeText={(v) => setExpenseForm((f) => ({ ...f, amount: v }))}
                      keyboardType="decimal-pad"
                    />
                    <TextField
                      label="Category"
                      value={expenseForm.category}
                      onChangeText={(v) => setExpenseForm((f) => ({ ...f, category: v }))}
                      placeholder={EXPENSE_CATEGORIES.join(', ')}
                    />
                    <Row gap="sm">
                      <Button label="Save" onPress={saveExpense} />
                      <Button variant="secondary" label="Cancel" onPress={() => setExpenseForm(null)} />
                    </Row>
                  </Stack>
                </Card>
              ) : null}
              {Object.keys(byCategory).length ? (
                <Card>
                  <Stack gap="sm">
                    <Text variant="label">By category</Text>
                    {Object.entries(byCategory).map(([cat, amt]) => (
                      <Row key={cat} style={styles.between}>
                        <Text>{cat}</Text>
                        <Text>{formatMoney(amt, state.details.currency)}</Text>
                      </Row>
                    ))}
                  </Stack>
                </Card>
              ) : null}
              {state.expenses.map((e) => (
                <ListRow
                  key={e.id}
                  title={e.title}
                  subtitle={`${e.category} · ${formatMoney(e.amount, state.details.currency)}`}
                  trailing={
                    <Button size="sm" variant="ghost" label="Del" onPress={() => removeExpense(e.id)} />
                  }
                />
              ))}
            </Stack>
          ) : null}

          {tab === 'packing' ? (
            <Stack gap="md">
              <Row style={styles.between}>
                <Text variant="caption" color="muted">
                  {pack.percent}% packed
                </Text>
                <Button size="sm" label="Add item" onPress={addPackItem} />
              </Row>
              <Card padding="none">
                {state.packing.map((p) => (
                  <ListRow
                    key={p.id}
                    title={p.title}
                    subtitle={p.category}
                    onPress={() => togglePack(p.id)}
                    trailing={
                      <Badge label={p.done ? 'Done' : 'Todo'} tone={p.done ? 'success' : 'neutral'} />
                    }
                  />
                ))}
              </Card>
            </Stack>
          ) : null}

          {!loaded ? <Text color="muted">Loading…</Text> : null}
        </Stack>
      </ScrollView>
      <ConfirmSheet
        open={confirmClear}
        title="Clear honeymoon plan?"
        body="Removes itinerary, bookings, expenses and packing on this device."
        confirmLabel="Clear"
        onConfirm={clearAll}
        onCancel={() => setConfirmClear(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  between: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  barBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: 8,
    borderRadius: 4,
  },
});

export default HoneymoonScreen;
