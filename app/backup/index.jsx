import React, { useMemo, useState, useCallback } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Pressable, Text } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  BackupExplainer, BackupActions, LastBackupCard, AutoBackupSettings,
  BackupTips, DangerZone, SyncedWorkspaceWarning, BackupLabelInput,
  BackupSizeEstimate, BackupProgress, RestoreSheet, SummaryCard,
} from '../../src/features/backup';
import { useBackupStore } from '../../src/store/backupStore';
import { estimateBackupSize } from '../../src/features/backup/backupService';

/**
 * Wire `getters` and `setters` to your real stores when integrating.
 * Example getters: { guests: () => useGuestStore.getState().guests, ... }
 */
export default function BackupHomeScreen() {
  const router = useRouter();
  const history = useBackupStore((s) => s.listHistory());
  const stats = useBackupStore((s) => s.getStats());
  const lastJob = useBackupStore((s) => s.lastJob);
  const autoEnabled = useBackupStore((s) => s.autoBackupEnabled);
  const intervalDays = useBackupStore((s) => s.autoBackupIntervalDays);
  const lastAuto = useBackupStore((s) => s.lastAutoBackupAt);
  const setAutoEnabled = useBackupStore((s) => s.setAutoBackupEnabled);
  const setInterval = useBackupStore((s) => s.setAutoBackupIntervalDays);
  const clearHistory = useBackupStore((s) => s.clearHistory);
  const addHistory = useBackupStore((s) => s.addHistory);
  const setJob = useBackupStore((s) => s.setJob);

  const [label, setLabel] = useState('');
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // Placeholder getters — replace with real store snapshots
  const getters = useMemo(() => ({
    demo: () => ({ byId: { a: { id: 'a', title: 'demo' } }, allIds: ['a'] }),
  }), []);

  const size = useMemo(() => estimateBackupSize(getters), [getters]);

  const onBackup = useCallback(async () => {
    setBusy(true);
    setJob({ status: 'collecting', progress: 0.2 });
    try {
      const { createBackupText } = await import('../../src/features/backup/backupService');
      const text = createBackupText(getters, { label: label || 'Manual backup' });
      setJob({ status: 'done', progress: 1, resultBytes: text.length });
      addHistory({
        label: label || 'Manual backup',
        recordCount: 1,
        byteSize: text.length,
        source: 'manual',
      });
      // Hook Share / FileSystem here in the real app
      console.log('[backup] created', text.length, 'chars');
    } catch (e) {
      setJob({ status: 'failed', error: String(e?.message || e), progress: 0 });
    } finally {
      setBusy(false);
    }
  }, [getters, label, addHistory, setJob]);

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen
        options={{
          title: 'Backup',
          headerRight: () => (
            <Pressable onPress={() => router.push('/backup/history')} hitSlop={12}>
              <Text style={styles.link}>History</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <SummaryCard
          title="Backup health"
          metric={stats.historyCount}
          metricLabel="saved"
          secondary={[
            { value: stats.lastBackupAt ? 'Yes' : 'No', label: 'Has backup' },
            { value: autoEnabled ? 'On' : 'Off', label: 'Reminders' },
          ]}
          tone={stats.historyCount ? 'success' : 'warning'}
        />
        <SyncedWorkspaceWarning visible={false} />
        <LastBackupCard entry={history[0]} onPress={() => router.push('/backup/history')} />
        <BackupProgress job={lastJob} />
        <BackupLabelInput value={label} onChange={setLabel} />
        <BackupSizeEstimate bytes={size.bytes} label={size.label} />
        <BackupActions
          busy={busy}
          onBackup={onBackup}
          onRestore={() => setRestoreOpen(true)}
          onHistory={() => router.push('/backup/history')}
        />
        <AutoBackupSettings
          enabled={autoEnabled}
          onEnabledChange={setAutoEnabled}
          intervalDays={intervalDays}
          onIntervalChange={setInterval}
          lastAutoBackupAt={lastAuto}
        />
        <BackupExplainer />
        <BackupTips />
        <DangerZone onClearHistory={clearHistory} />
      </ScrollView>
      <RestoreSheet
        visible={restoreOpen}
        onClose={() => setRestoreOpen(false)}
        onBackUp={onBackup}
        canRestore
        onRestore={async () => {
          // Wire applyBackup(checked, setters) here
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF7F5' },
  content: { padding: 16, paddingBottom: 48, gap: 4 },
  link: { color: '#C93862', fontWeight: '600', marginRight: 8 },
});
