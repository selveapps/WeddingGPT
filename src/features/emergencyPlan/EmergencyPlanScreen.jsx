/**
 * EmergencyPlanScreen — scenarios, hospital info, readiness score, share text.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Share, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Screen, Stack, Row, Text, Card, Button, Badge, ScreenHeader, SectionHeader,
  TextField, ListRow, useToast,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { storage } from '@/services/storage';
import {
  EMERGENCY_PLAN_KEY, emptyEmergencyState, normaliseEmergencyState, planReadiness,
  scenarioProgress, toggleChecklistItem, createScenario, exportEmergencyText,
  ScenarioSeverity,
} from './emergencyPlanModel';

export function EmergencyPlanScreen() {
  const router = useRouter();
  const toast = useToast();
  const { colors } = useTheme();
  const [state, setState] = useState(emptyEmergencyState);
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    let a = true;
    storage.get(EMERGENCY_PLAN_KEY).then((raw) => {
      if (a) setState(normaliseEmergencyState(raw));
    }).finally(() => { if (a) setLoaded(true); });
    return () => { a = false; };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    storage.set(EMERGENCY_PLAN_KEY, { ...state, updatedAt: new Date().toISOString() }).catch(() => {});
  }, [state, loaded]);

  const readiness = useMemo(() => planReadiness(state), [state]);

  const updateField = useCallback((key, value) => {
    setState((s) => ({ ...s, [key]: value }));
  }, []);

  const onToggleCheck = useCallback((scenarioId, itemId) => {
    setState((s) => ({
      ...s,
      scenarios: s.scenarios.map((sc) =>
        sc.id === scenarioId ? toggleChecklistItem(sc, itemId) : sc
      ),
    }));
  }, []);

  const saveScenario = useCallback(() => {
    if (!editing?.title?.trim()) {
      toast.error('Title required');
      return;
    }
    setState((s) => {
      const exists = s.scenarios.some((x) => x.id === editing.id);
      const scenarios = exists
        ? s.scenarios.map((x) => (x.id === editing.id ? editing : x))
        : [...s.scenarios, editing];
      return { ...s, scenarios };
    });
    setEditing(null);
    toast.success('Scenario saved');
  }, [editing, toast]);

  const onShare = useCallback(async () => {
    try {
      await Share.share({ message: exportEmergencyText(state), title: 'Emergency plan' });
    } catch {
      toast.error('Share failed');
    }
  }, [state, toast]);

  return (
    <Screen testID="emergency-plan" edges={['top', 'bottom']}>
      <ScreenHeader
        title="Emergency plan"
        subtitle="Day-of contingencies"
        onBack={() => router.back()}
        trailing={<Button variant="ghost" size="sm" label="Share" onPress={onShare} />}
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <Stack gap="md">
          <Card>
            <Stack gap="sm">
              <Row style={styles.between}>
                <Text variant="caption" color="muted">Readiness</Text>
                <Badge label={`${readiness.percent}%`} tone="brand" />
              </Row>
              <View style={[styles.barBg, { backgroundColor: colors.surfaceSunken }]}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${Math.min(100, readiness.percent)}%`, backgroundColor: colors.brand },
                  ]}
                />
              </View>
            </Stack>
          </Card>

          <SectionHeader title="Key locations" />
          <Card>
            <Stack gap="md">
              <TextField
                label="Assembly / meetup point"
                value={state.assemblyPoint}
                onChangeText={(v) => updateField('assemblyPoint', v)}
              />
              <TextField
                label="Emergency number"
                value={state.emergencyNumber}
                onChangeText={(v) => updateField('emergencyNumber', v)}
                placeholder="112 / local"
                keyboardType="phone-pad"
              />
              <TextField
                label="Hospital name"
                value={state.hospitalName}
                onChangeText={(v) => updateField('hospitalName', v)}
              />
              <TextField
                label="Hospital phone"
                value={state.hospitalPhone}
                onChangeText={(v) => updateField('hospitalPhone', v)}
                keyboardType="phone-pad"
              />
              <TextField
                label="Hospital address"
                value={state.hospitalAddress}
                onChangeText={(v) => updateField('hospitalAddress', v)}
                multiline
              />
              <TextField
                label="General notes"
                value={state.generalNotes}
                onChangeText={(v) => updateField('generalNotes', v)}
                multiline
              />
            </Stack>
          </Card>

          <Row style={styles.between}>
            <SectionHeader title="Scenarios" />
            <Button
              size="sm"
              label="Add"
              onPress={() =>
                setEditing(
                  createScenario({ severity: ScenarioSeverity.MEDIUM, checklist: [] })
                )
              }
            />
          </Row>

          {editing ? (
            <Card>
              <Stack gap="md">
                <TextField label="Title" value={editing.title} onChangeText={(v) => setEditing((e) => ({ ...e, title: v }))} />
                <TextField label="Severity" value={editing.severity} onChangeText={(v) => setEditing((e) => ({ ...e, severity: v }))} />
                <TextField label="Triggers" value={editing.triggers} onChangeText={(v) => setEditing((e) => ({ ...e, triggers: v }))} multiline />
                <TextField label="Plan" value={editing.plan} onChangeText={(v) => setEditing((e) => ({ ...e, plan: v }))} multiline />
                <TextField label="Owner" value={editing.owner} onChangeText={(v) => setEditing((e) => ({ ...e, owner: v }))} />
                <Row gap="sm">
                  <Button label="Save" onPress={saveScenario} />
                  <Button variant="secondary" label="Cancel" onPress={() => setEditing(null)} />
                </Row>
              </Stack>
            </Card>
          ) : null}

          {(state.scenarios || []).map((sc) => {
            const prog = scenarioProgress(sc);
            const open = expanded === sc.id;
            return (
              <Card key={sc.id}>
                <Stack gap="sm">
                  <ListRow
                    title={sc.title}
                    subtitle={`${sc.severity} · ${prog.done}/${prog.total} checks · ${sc.owner || 'No owner'}`}
                    trailing={<Badge label={`${prog.percent}%`} tone="neutral" />}
                    onPress={() => setExpanded(open ? null : sc.id)}
                    showChevron
                  />
                  {open ? (
                    <Stack gap="sm">
                      <Text variant="caption" color="muted">
                        Triggers: {sc.triggers || '—'}
                      </Text>
                      <Text>{sc.plan}</Text>
                      {(sc.checklist || []).map((c) => (
                        <ListRow
                          key={c.id}
                          title={c.text}
                          onPress={() => onToggleCheck(sc.id, c.id)}
                          trailing={
                            <Badge label={c.done ? 'Done' : 'Todo'} tone={c.done ? 'success' : 'neutral'} />
                          }
                        />
                      ))}
                      <Button size="sm" variant="secondary" label="Edit scenario" onPress={() => setEditing({ ...sc })} />
                    </Stack>
                  ) : null}
                </Stack>
              </Card>
            );
          })}
          {!loaded ? <Text color="muted">Loading…</Text> : null}
        </Stack>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
});

export default EmergencyPlanScreen;
