import React, { useEffect, useMemo, useState } from 'react';

import {
  Stack,
  Row,
  Text,
  Card,
  Chip,
  Button,
  Checkbox,
  TextField,
  ProgressBar,
  SectionHeader,
  LoadingState,
  Touchable,
  useToast,
} from '@/design-system/components';

import { LabScreen } from '../shared/LabScreen';
import { selectItems } from '../shared/createCollectionStore';
import { shareText } from '../shared/share';
import { useHydrated } from '../shared/useHydrated';
import { useLabPackingStore } from './store';
import { PACKING_LISTS, itemsFor, listProgress, packingText, sortForDisplay } from './model';

export default function PackingListScreen() {
  const toast = useToast();
  const hydrated = useHydrated(useLabPackingStore);
  const items = useLabPackingStore(selectItems);
  const { ensureSeeded, togglePacked, addCustom, remove, restoreDefaults, unpackAll } =
    useLabPackingStore.getState();

  const [listKey, setListKey] = useState(PACKING_LISTS[0].key);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (hydrated) ensureSeeded(listKey);
  }, [hydrated, listKey, ensureSeeded]);

  const list = useMemo(() => sortForDisplay(itemsFor(items, listKey)), [items, listKey]);
  const progress = listProgress(items, listKey);

  const add = () => {
    if (addCustom(listKey, draft)) setDraft('');
  };

  const share = async () => {
    const ok = await shareText(packingText(items, listKey), 'Packing list');
    if (!ok) toast.error('Sharing is not available here');
  };

  return (
    <LabScreen
      title="Packing lists"
      intro="Ready-made lists for the day itself, from the emergency kit to the honeymoon. Tick things off as they go in the bag."
    >
      <Row gap="xs" wrap>
        {PACKING_LISTS.map((entry) => (
          <Chip
            key={entry.key}
            label={entry.label}
            selected={entry.key === listKey}
            onPress={() => setListKey(entry.key)}
          />
        ))}
      </Row>

      {!hydrated ? (
        <LoadingState compact />
      ) : (
        <>
          <ProgressBar value={progress.ratio} label={`${progress.packed} of ${progress.total} packed`} />

          <Row gap="sm" align="flex-end">
            <TextField
              label="Add your own"
              value={draft}
              onChangeText={setDraft}
              placeholder="Grandma's handkerchief"
              onSubmitEditing={add}
              containerStyle={{ flex: 1 }}
            />
            <Button label="Add" size="md" variant="secondary" fullWidth={false} onPress={add} disabled={!draft.trim()} />
          </Row>

          <Card>
            <Stack gap="sm">
              {list.map((item) => (
                <Touchable
                  key={item.id}
                  onLongPress={() => remove(item.id)}
                  accessibilityHint="Long press to remove"
                  scaleOnPress={false}
                >
                  <Checkbox checked={item.packed} onChange={() => togglePacked(item.id)} label={item.title} />
                </Touchable>
              ))}
              {list.length === 0 ? (
                <Text variant="bodySm" color="muted">
                  This list is empty.
                </Text>
              ) : null}
            </Stack>
          </Card>

          <Stack gap="sm">
            <SectionHeader title="List tools" />
            <Button label="Share this list" iconLeft="send" onPress={share} />
            <Row gap="xs">
              <Button
                label="Unpack all"
                variant="ghost"
                fullWidth={false}
                onPress={() => unpackAll(listKey)}
                disabled={!progress.packed}
              />
              <Button
                label="Restore defaults"
                variant="ghost"
                fullWidth={false}
                onPress={() => {
                  const added = restoreDefaults(listKey);
                  toast.info(added ? `Put back ${added} item${added === 1 ? '' : 's'}` : 'Nothing missing');
                }}
              />
            </Row>
          </Stack>
        </>
      )}
    </LabScreen>
  );
}
