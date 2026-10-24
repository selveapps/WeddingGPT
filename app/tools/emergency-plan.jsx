import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';

import { Screen, Stack as UIStack, Row, Text, Card, Button, PageHeader, Chip } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import {
  createEmergencyItem,
  DEFAULT_EMERGENCY_ITEMS,
  getEmergencyProgress,
  normaliseEmergencyPlan,
  toggleEmergencyItem,
} from '@/features/emergencyPlan/emergencyPlanModel';

const STORAGE_KEY = '@weddinggpt/emergency-plan/v1';

function Field({ label, value, onChangeText, placeholder, multiline = false, colors, spacing }) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Text variant="label" color="muted">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkSubtle}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[
          styles.input,
          {
            color: colors.ink,
            backgroundColor: colors.surface,
            borderColor: colors.border,
            minHeight: multiline ? 96 : 48,
          },
        ]}
      />
    </View>
  );
}

export default function EmergencyPlanScreen() {
  const router = useRouter();
  const { colors, spacing, radii } = useTheme();
  const [plan, setPlan] = useState(() => normaliseEmergencyPlan(null));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [venue, setVenue] = useState('');
  const [primaryContact, setPrimaryContact] = useState('');
  const [backupContact, setBackupContact] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!active || !raw) return;
        try {
          const saved = JSON.parse(raw);
          setPlan(normaliseEmergencyPlan(saved));
          setVenue(saved.venue ?? '');
          setPrimaryContact(saved.primaryContact ?? '');
          setBackupContact(saved.backupContact ?? '');
          setNotes(saved.notes ?? '');
        } catch {
          // A damaged local draft should not prevent the screen from opening.
          setPlan(normaliseEmergencyPlan(null));
        }
      })
      .catch(() => {
        if (active) {
          Alert.alert('Could not load saved plan', 'You can still edit the plan. Try saving again.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const progress = useMemo(() => getEmergencyProgress(plan.items), [plan.items]);

  const persist = useCallback(async (nextPlan, extra = {}) => {
    setSaving(true);
    try {
      const payload = {
        ...nextPlan,
        venue,
        primaryContact,
        backupContact,
        notes,
        ...extra,
        updatedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setPlan(normaliseEmergencyPlan(payload));
      if (extra.venue !== undefined) setVenue(extra.venue);
      if (extra.primaryContact !== undefined) setPrimaryContact(extra.primaryContact);
      if (extra.backupContact !== undefined) setBackupContact(extra.backupContact);
      if (extra.notes !== undefined) setNotes(extra.notes);
    } catch {
      Alert.alert('Save failed', 'Your changes could not be saved on this device. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [venue, primaryContact, backupContact, notes]);

  const saveDetails = useCallback(() => {
    persist(plan, { venue, primaryContact, backupContact, notes });
  }, [persist, plan, venue, primaryContact, backupContact, notes]);

  const handleToggle = useCallback((id) => {
    const next = { ...plan, items: toggleEmergencyItem(plan.items, id) };
    setPlan(next);
    // Persist immediately so a checked item is not lost when the user leaves.
    const payload = { ...next, venue, primaryContact, backupContact, notes, updatedAt: new Date().toISOString() };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(() => {
      Alert.alert('Could not save item', 'Please check device storage and try again.');
    });
  }, [plan, venue, primaryContact, backupContact, notes]);

  const addItem = useCallback(() => {
    const title = newTitle.trim();
    if (!title) {
      Alert.alert('Add a task name', 'Enter a short task before adding it.');
      return;
    }
    if (plan.items.length >= 80) {
      Alert.alert('Checklist is full', 'You can keep up to 80 emergency-plan items.');
      return;
    }
    const item = createEmergencyItem({ title, owner: newOwner.trim() });
    const next = { ...plan, items: [...plan.items, item] };
    setPlan(next);
    setNewTitle('');
    setNewOwner('');
    const payload = { ...next, venue, primaryContact, backupContact, notes, updatedAt: new Date().toISOString() };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(() => {
      Alert.alert('Could not save item', 'The item is visible for now, but was not saved.');
    });
  }, [newTitle, newOwner, plan, venue, primaryContact, backupContact, notes]);

  const removeItem = useCallback((id) => {
    Alert.alert('Remove checklist item?', 'This item will be removed from your emergency plan.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const next = { ...plan, items: plan.items.filter((item) => item.id !== id) };
          setPlan(next);
          const payload = { ...next, venue, primaryContact, backupContact, notes, updatedAt: new Date().toISOString() };
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(() => {
            Alert.alert('Could not save change', 'Please try again.');
          });
        },
      },
    ]);
  }, [plan, venue, primaryContact, backupContact, notes]);

  const sharePlan = useCallback(async () => {
    const completed = plan.items.filter((item) => item.done).length;
    const lines = [
      'WEDDING DAY EMERGENCY PLAN',
      `Venue: ${venue || 'Not added'}`,
      `Primary contact: ${primaryContact || 'Not added'}`,
      `Backup contact: ${backupContact || 'Not added'}`,
      `Checklist: ${completed}/${plan.items.length} complete`,
      '',
      ...plan.items.map((item) => `${item.done ? '[x]' : '[ ]'} ${item.title}${item.owner ? ` — ${item.owner}` : ''}`),
      '',
      `Notes: ${notes || 'None'}`,
    ];
    try {
      await Share.share({ title: 'Wedding Day Emergency Plan', message: lines.join('\n') });
    } catch {
      Alert.alert('Unable to share', 'Try again or copy the details manually.');
    }
  }, [plan, venue, primaryContact, backupContact, notes]);

  const resetChecklist = useCallback(() => {
    Alert.alert('Restore suggested checklist?', 'This adds any missing suggested items and keeps your custom items and completed status.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Restore',
        onPress: () => {
          const existing = new Set(plan.items.map((item) => item.title.toLowerCase()));
          const missing = DEFAULT_EMERGENCY_ITEMS
            .filter((item) => !existing.has(item.title.toLowerCase()))
            .map((item) => createEmergencyItem(item));
          const next = { ...plan, items: [...plan.items, ...missing] };
          setPlan(next);
          const payload = { ...next, venue, primaryContact, backupContact, notes, updatedAt: new Date().toISOString() };
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(() => {
            Alert.alert('Could not save checklist', 'Please try again.');
          });
        },
      },
    ]);
  }, [plan, venue, primaryContact, backupContact, notes]);

  if (loading) {
    return (
      <Screen>
        <UIStack style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} gap="md">
          <ActivityIndicator color={colors.brand} />
          <Text color="muted">Loading your emergency plan…</Text>
        </UIStack>
      </Screen>
    );
  }

  return (
    <Screen bottomInset={spacing.xxl}>
      <Stack.Screen options={{ title: 'Wedding Day Emergency Plan', headerShown: false }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: spacing.xxl }}>
          <UIStack gap="xl">
            <PageHeader
              eyebrow="Wedding day"
              title="Your backup plan"
              subtitle="Keep the essentials and last-minute fixes in one place."
              actionLabel="Back"
              onActionPress={() => router.back()}
            />

            <Card tone="raised">
              <UIStack gap="md">
                <Row justify="space-between" align="center">
                  <View style={{ flex: 1 }}>
                    <Text variant="eyebrow" color="muted">READINESS</Text>
                    <Text variant="h3">{progress.percent}% ready</Text>
                  </View>
                  <Chip>{progress.done} of {progress.total}</Chip>
                </Row>
                <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSunken }]}>
                  <View style={[styles.progressFill, { width: `${progress.percent}%`, backgroundColor: colors.brand }]} />
                </View>
                <Text variant="bodySm" color="muted">
                  A practical checklist for the small surprises that can disrupt a wedding day.
                </Text>
              </UIStack>
            </Card>

            <Card>
              <UIStack gap="md">
                <Text variant="h4">Key details</Text>
                <Field label="Venue / meeting point" value={venue} onChangeText={setVenue} placeholder="Venue name and address" colors={colors} spacing={spacing} />
                <Field label="Primary day-of contact" value={primaryContact} onChangeText={setPrimaryContact} placeholder="Name · phone number" colors={colors} spacing={spacing} />
                <Field label="Backup contact" value={backupContact} onChangeText={setBackupContact} placeholder="Name · phone number" colors={colors} spacing={spacing} />
                <Field label="Important notes" value={notes} onChangeText={setNotes} placeholder="Vendor arrival details, access instructions, backup arrangements…" multiline colors={colors} spacing={spacing} />
                <Button label={saving ? 'Saving…' : 'Save key details'} iconLeft="check" onPress={saveDetails} disabled={saving} />
              </UIStack>
            </Card>

            <UIStack gap="sm">
              <Row justify="space-between" align="center">
                <Text variant="h3">Emergency checklist</Text>
                <Pressable accessibilityRole="button" onPress={resetChecklist} hitSlop={10}>
                  <Text variant="label" color="brand">Restore defaults</Text>
                </Pressable>
              </Row>
              {plan.items.map((item) => (
                <View key={item.id} style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg }]}>
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: item.done }}
                    accessibilityLabel={`${item.title}, ${item.done ? 'complete' : 'not complete'}`}
                    onPress={() => handleToggle(item.id)}
                    style={[styles.checkbox, { borderColor: item.done ? colors.brand : colors.borderStrong, backgroundColor: item.done ? colors.brand : 'transparent' }]}
                  >
                    {item.done ? <Text color="inverse" variant="label">✓</Text> : null}
                  </Pressable>
                  <Pressable style={{ flex: 1, gap: 4 }} onPress={() => handleToggle(item.id)}>
                    <Text variant="body" style={{ textDecorationLine: item.done ? 'line-through' : 'none' }}>{item.title}</Text>
                    {item.owner ? <Text variant="caption" color="muted">Responsible: {item.owner}</Text> : null}
                  </Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${item.title}`} onPress={() => removeItem(item.id)} hitSlop={10} style={styles.removeButton}>
                    <Text color="danger" variant="label">×</Text>
                  </Pressable>
                </View>
              ))}
            </UIStack>

            <Card>
              <UIStack gap="md">
                <Text variant="h4">Add a custom task</Text>
                <Field label="Task" value={newTitle} onChangeText={setNewTitle} placeholder="e.g. Keep spare safety pins with the coordinator" colors={colors} spacing={spacing} />
                <Field label="Responsible person (optional)" value={newOwner} onChangeText={setNewOwner} placeholder="Name or role" colors={colors} spacing={spacing} />
                <Button label="Add to checklist" iconLeft="plus" onPress={addItem} />
              </UIStack>
            </Card>

            <Button label="Share emergency plan" iconLeft="share" onPress={sharePlan} />
            <Text variant="caption" color="muted">
              This plan is saved locally on this device. Sharing sends the current details through your device's share sheet. Avoid storing sensitive information you would not want shared.
            </Text>
          </UIStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  progressTrack: {
    height: 8,
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 99,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderWidth: 1.5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
