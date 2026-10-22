import React, { useState } from 'react';

import {
  Stack,
  Row,
  Text,
  Card,
  Badge,
  Button,
  TextField,
  ListRow,
  SectionHeader,
  ConfirmSheet,
  useToast,
} from '@/design-system/components';
import { formatRelativeDay, toISODate } from '@/lib/date';

import { LabScreen } from '../shared/LabScreen';
import { selectItems } from '../shared/createCollectionStore';
import { shareText } from '../shared/share';
import { useLabSyncStore } from './store';
import { readWorkspace, writeWorkspace } from './workspace';
import {
  SYNC_COLLECTIONS,
  SYNC_SINGLETONS,
  buildSnapshot,
  decodeSnapshot,
  encodeSnapshot,
  mergeSnapshot,
} from './model';

const SECTIONS = [...SYNC_COLLECTIONS, ...SYNC_SINGLETONS];

export default function PartnerSyncScreen() {
  const toast = useToast();
  const history = useLabSyncStore(selectItems);
  const addLog = useLabSyncStore((state) => state.add);

  const [deviceName, setDeviceName] = useState('');
  const [pasted, setPasted] = useState('');
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);

  const exportPlan = async () => {
    const snapshot = buildSnapshot(readWorkspace(), { deviceName: deviceName.trim() });
    const ok = await shareText(encodeSnapshot(snapshot), 'Our WeddingGPT plan');
    if (!ok) toast.error('Sharing is not available here');
  };

  const previewMerge = () => {
    const decoded = decodeSnapshot(pasted);
    if (!decoded.ok) {
      setError(decoded.error);
      setPreview(null);
      return;
    }
    setError('');
    setPreview({ remote: decoded.snapshot, result: mergeSnapshot(readWorkspace(), decoded.snapshot) });
  };

  const applyMerge = () => {
    setConfirming(false);
    if (!preview) return;
    // Re-merge against the latest local data, in case anything changed since the preview.
    const result = mergeSnapshot(readWorkspace(), preview.remote);
    writeWorkspace(result);
    addLog({ from: preview.remote.deviceName || 'Partner', changes: result.changes });
    toast.success(`Merged ${result.changes} change${result.changes === 1 ? '' : 's'}`);
    setPreview(null);
    setPasted('');
  };

  return (
    <LabScreen
      title="Partner sync"
      intro="Plan on two phones: share your plan with your partner, and merge theirs into yours. When you both changed the same thing, the most recent edit wins."
    >
      <Card>
        <Stack gap="md">
          <Text variant="h3">Send my plan</Text>
          <TextField
            label="This phone's name"
            value={deviceName}
            onChangeText={setDeviceName}
            placeholder="Sam's phone"
            helper="Shown to your partner when they merge."
          />
          <Button label="Share my plan" iconLeft="send" onPress={exportPlan} />
        </Stack>
      </Card>

      <Card>
        <Stack gap="md">
          <Text variant="h3">{"Merge my partner's plan"}</Text>
          <TextField
            label="Paste their plan"
            value={pasted}
            onChangeText={(text) => {
              setPasted(text);
              setPreview(null);
            }}
            multiline
            numberOfLines={4}
            autoCapitalize="none"
            autoCorrect={false}
            error={error}
          />
          <Button label="Preview changes" variant="secondary" onPress={previewMerge} disabled={!pasted.trim()} />
        </Stack>
      </Card>

      {preview ? (
        <Stack gap="sm">
          <SectionHeader
            title="What will change"
            subtitle={`From ${preview.remote.deviceName || 'your partner'}, exported ${formatRelativeDay(
              toISODate(new Date(preview.remote.exportedAt))
            ).toLowerCase()}`}
          />
          {!preview.result.sameWedding ? (
            <Card tone="danger">
              <Text variant="bodySm">
                This plan is for a different wedding. Merging would mix the two - only continue if that is what you want.
              </Text>
            </Card>
          ) : null}
          <Card padding="none">
            {SECTIONS.map(({ key, label }) => {
              const stats = preview.result.stats[key];
              const parts = [];
              if (stats.added) parts.push(`${stats.added} new`);
              if (stats.updated) parts.push(`${stats.updated} updated`);
              return (
                <ListRow
                  key={key}
                  title={label}
                  meta={parts.length ? parts.join(', ') : 'No change'}
                  showChevron={false}
                />
              );
            })}
          </Card>
          <Button
            label={preview.result.changes ? `Merge ${preview.result.changes} changes` : 'Already up to date'}
            onPress={() => setConfirming(true)}
            disabled={!preview.result.changes}
          />
        </Stack>
      ) : null}

      {history.length ? (
        <Stack gap="sm">
          <SectionHeader title="Recent merges" />
          <Card padding="none">
            {[...history].reverse().slice(0, 5).map((entry) => (
              <ListRow
                key={entry.id}
                title={entry.from}
                subtitle={formatRelativeDay(toISODate(new Date(entry.createdAt)))}
                trailing={<Badge label={`${entry.changes} changes`} tone="info" />}
                showChevron={false}
              />
            ))}
          </Card>
        </Stack>
      ) : null}

      <Row>
        <Text variant="caption" color="subtle">
          Known gap: deleting something on one phone does not delete it on the other yet.
        </Text>
      </Row>

      <ConfirmSheet
        visible={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={applyMerge}
        title="Merge into your real plan?"
        message="This updates your tasks, budget and guest list on this phone. It cannot be undone from Labs."
        confirmLabel="Merge"
      />
    </LabScreen>
  );
}
