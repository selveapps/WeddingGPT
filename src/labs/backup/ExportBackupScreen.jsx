import React, { useState } from 'react';
import { useRouter } from 'expo-router';

import {
  Stack,
  Text,
  Card,
  Badge,
  Button,
  TextField,
  ListRow,
  SectionHeader,
  useToast,
} from '@/design-system/components';
import {
  useWeddingStore,
  useBudgetStore,
  useGuestStore,
  usePlanningStore,
  selectAllGuests,
  selectAllHouseholds,
  selectAllExpenses,
  selectAllBudgetCategories,
  selectAllTasks,
  selectAllCategories,
} from '@/store';
import { formatMediumDate, toISODate } from '@/lib/date';

import { LabScreen } from '../shared/LabScreen';
import { shareText } from '../shared/share';
import { buildSnapshot } from '../sync/model';
import { readWorkspace } from '../sync/workspace';
import { budgetCsv, checklistText, guestsCsv, planSummary, verifyBackup, wrapBackup } from './model';

export default function ExportBackupScreen() {
  const router = useRouter();
  const toast = useToast();

  const wedding = useWeddingStore((state) => state.wedding);
  const budget = useBudgetStore((state) => state.budget);
  const guests = useGuestStore(selectAllGuests);
  const households = useGuestStore(selectAllHouseholds);
  const expenses = useBudgetStore(selectAllExpenses);
  const budgetCategories = useBudgetStore(selectAllBudgetCategories);
  const tasks = usePlanningStore(selectAllTasks);
  const taskCategories = usePlanningStore(selectAllCategories);

  const [pasted, setPasted] = useState('');
  const [check, setCheck] = useState(null);

  const share = async (text, title) => {
    const ok = await shareText(text, title);
    if (!ok) toast.error('Sharing is not available here');
  };

  const exports = [
    {
      key: 'summary',
      title: 'Plan summary',
      subtitle: 'Date, progress, budget and RSVPs in a few lines',
      run: () => share(planSummary({ wedding, tasks, budget, expenses, guests }), 'Plan summary'),
    },
    {
      key: 'guests',
      title: 'Guest list (CSV)',
      subtitle: `${guests.length} guests, for Excel, Numbers or Sheets`,
      run: () => share(guestsCsv(guests, households), 'guests.csv'),
    },
    {
      key: 'budget',
      title: 'Budget (CSV)',
      subtitle: `${expenses.length} expenses with paid and owed`,
      run: () => share(budgetCsv(expenses, budgetCategories), 'budget.csv'),
    },
    {
      key: 'checklist',
      title: 'Checklist',
      subtitle: `${tasks.length} tasks, open ones first`,
      run: () => share(checklistText(tasks, taskCategories), 'Checklist'),
    },
  ];

  const backUp = () => {
    const backup = wrapBackup(buildSnapshot(readWorkspace(), { deviceName: 'Backup' }));
    share(backup, `WeddingGPT backup ${toISODate(new Date())}`);
  };

  return (
    <LabScreen
      title="Export and backup"
      intro="Your plan lives on this phone. Take a copy out as spreadsheets and text, or save a full backup somewhere safe."
    >
      <Stack gap="sm">
        <SectionHeader title="Export" />
        <Card padding="none">
          {exports.map((entry) => (
            <ListRow key={entry.key} title={entry.title} subtitle={entry.subtitle} icon="send" onPress={entry.run} />
          ))}
        </Card>
      </Stack>

      <Stack gap="sm">
        <SectionHeader title="Full backup" subtitle="Save it to Notes, email it to yourself, or keep it in your files." />
        <Button label="Share a full backup" iconLeft="lock" onPress={backUp} />
      </Stack>

      <Card>
        <Stack gap="md">
          <Text variant="h3">Check a backup</Text>
          <TextField
            label="Paste a backup"
            value={pasted}
            onChangeText={(text) => {
              setPasted(text);
              setCheck(null);
            }}
            multiline
            numberOfLines={4}
            autoCapitalize="none"
            autoCorrect={false}
            error={check && !check.ok ? check.error : ''}
          />
          <Button
            label="Check it"
            variant="secondary"
            onPress={() => setCheck(verifyBackup(pasted))}
            disabled={!pasted.trim()}
          />
          {check?.ok ? (
            <Stack gap="sm">
              <Badge
                label={check.verified ? 'Backup is intact' : 'No checksum - looks valid'}
                tone={check.verified ? 'success' : 'info'}
              />
              <Text variant="bodySm" color="muted">
                {`${check.weddingName ?? 'Wedding'} - saved ${formatMediumDate(toISODate(new Date(check.snapshot.exportedAt)))}`}
              </Text>
              <Card padding="none" tone="muted">
                {check.counts.map((entry) => (
                  <ListRow key={entry.key} title={entry.label} meta={String(entry.count)} showChevron={false} />
                ))}
              </Card>
              <Button
                label="Restore it with partner sync"
                variant="ghost"
                iconRight="arrowRight"
                onPress={() => router.push('/labs/sync')}
              />
            </Stack>
          ) : null}
        </Stack>
      </Card>
    </LabScreen>
  );
}
