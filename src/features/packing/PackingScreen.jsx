import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';

import {
  BottomSheet,
  Button,
  Card,
  Checkbox,
  Chip,
  EmptyState,
  Icon,
  ProgressBar,
  Row,
  Screen,
  ScreenHeader,
  Stack,
  Text,
  TextField,
  Touchable,
  useToast,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { usePackingStore, useWeddingStore, selectPackingItems, selectWeddingId } from '@/store';
import {
  PACKING_LIMITS,
  PACKING_LISTS,
  itemsFor,
  listByKey,
  listProgress,
  missingTemplateItems,
  packingText,
  sortForDisplay,
  templateItems,
} from '@/models';
import { shareText } from '@/services/share';

import { importLabPacking } from './labsImport';

/**
 * Packing lists (graduated from Labs): the emergency kit, the getting-ready
 * bag, the box for the venue and the honeymoon. Each starts from a list of
 * the usual things when the couple asks, and syncs, so whoever packs the car
 * can tick things off.
 */
export function PackingScreen() {
  const toast = useToast();
  const { spacing } = useTheme();
  const weddingId = useWeddingStore(selectWeddingId);
  const items = usePackingStore(selectPackingItems);
  const { startFromTemplate, restoreDefaults, addCustom, togglePacked, removeItem, unpackAll } =
    usePackingStore.getState();

  const [listKey, setListKey] = useState(PACKING_LISTS[0].key);
  const [draft, setDraft] = useState('');
  const [renaming, setRenaming] = useState(null);

  useEffect(() => {
    importLabPacking({ weddingId });
  }, [weddingId]);

  const list = listByKey(listKey);
  const shown = useMemo(() => sortForDisplay(itemsFor(items, listKey)), [items, listKey]);
  const progress = listProgress(items, listKey);
  const missing = missingTemplateItems(items, listKey).length;
  const full = shown.length >= PACKING_LIMITS.perList;

  const add = () => {
    if (addCustom(listKey, draft, weddingId)) setDraft('');
  };

  const share = async () => {
    const ok = await shareText(packingText(items, listKey), list.label);
    if (!ok) toast.error('Sharing is not available here');
  };

  const remove = (item) => {
    removeItem(item.id);
    toast.info(`${item.title} removed`, {
      actionLabel: 'Undo',
      onAction: () => usePackingStore.getState().restoreItem(item),
    });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen bottomInset={spacing.xxl}>
        <Stack gap="lg">
          <ScreenHeader eyebrow="Planning" title="Packing lists" />

          <Row gap="xs" wrap align="flex-start">
            {PACKING_LISTS.map((entry) => {
              const { packed, total } = listProgress(items, entry.key);
              return (
                <Chip
                  key={entry.key}
                  label={total ? `${entry.label} ${packed}/${total}` : entry.label}
                  selected={entry.key === listKey}
                  onPress={() => setListKey(entry.key)}
                />
              );
            })}
          </Row>

          {shown.length === 0 ? (
            <EmptyState
              icon="checklist"
              title={`Nothing in the ${list.label.toLowerCase()} yet`}
              message={`Start from the ${templateItems(listKey).length} things most couples pack, or add your own below.`}
              actionLabel="Start from our list"
              onAction={() => startFromTemplate(listKey, weddingId)}
            />
          ) : (
            <>
              <Stack gap="xs">
                <ProgressBar value={progress.ratio} />
                <Text variant="bodySm" color="muted">
                  {progress.packed === progress.total
                    ? `Everything is packed (${progress.total})`
                    : `${progress.packed} of ${progress.total} packed`}
                </Text>
              </Stack>

              <Card>
                <Stack gap="xs">
                  {shown.map((item) => (
                    <Row key={item.id} gap="sm" align="center">
                      <Touchable
                        onPress={() => togglePacked(item.id)}
                        onLongPress={() => setRenaming(item)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: item.packed }}
                        accessibilityLabel={item.title}
                        accessibilityHint="Long press to rename"
                        scaleOnPress={false}
                        style={{ flex: 1 }}
                      >
                        <Row gap="sm" align="center">
                          <Checkbox
                            checked={item.packed}
                            onChange={() => togglePacked(item.id)}
                            round={false}
                            size={20}
                          />
                          <Text
                            variant="body"
                            color={item.packed ? 'subtle' : 'default'}
                            style={[{ flex: 1 }, item.packed ? { textDecorationLine: 'line-through' } : null]}
                          >
                            {item.title}
                          </Text>
                        </Row>
                      </Touchable>
                      <Touchable onPress={() => remove(item)} accessibilityLabel={`Remove ${item.title}`}>
                        <Icon name="close" size="sm" color="muted" />
                      </Touchable>
                    </Row>
                  ))}
                </Stack>
              </Card>
            </>
          )}

          <Row gap="sm" align="flex-end">
            <TextField
              label="Add your own"
              value={draft}
              onChangeText={setDraft}
              placeholder="Grandma's handkerchief"
              onSubmitEditing={add}
              containerStyle={{ flex: 1 }}
            />
            <Button
              label="Add"
              size="md"
              variant="secondary"
              fullWidth={false}
              onPress={add}
              disabled={!draft.trim() || full}
            />
          </Row>

          {shown.length ? (
            <Stack gap="xs">
              <Button label="Share this list" iconLeft="send" variant="secondary" onPress={share} />
              <Row gap="xs" wrap>
                <Button
                  label="Unpack all"
                  variant="ghost"
                  fullWidth={false}
                  disabled={!progress.packed}
                  onPress={() => {
                    const count = unpackAll(listKey);
                    toast.info(`${count} ${count === 1 ? 'item' : 'items'} unticked`);
                  }}
                />
                {missing ? (
                  <Button
                    label={`Put back ${missing} removed`}
                    variant="ghost"
                    fullWidth={false}
                    onPress={() => {
                      const added = restoreDefaults(listKey, weddingId);
                      toast.info(`Put back ${added} ${added === 1 ? 'item' : 'items'}`);
                    }}
                  />
                ) : null}
              </Row>
            </Stack>
          ) : null}
        </Stack>

        {renaming ? <RenameSheet item={renaming} onClose={() => setRenaming(null)} /> : null}
      </Screen>
    </KeyboardAvoidingView>
  );
}

function RenameSheet({ item, onClose }) {
  const [title, setTitle] = useState(item.title);
  return (
    <BottomSheet
      visible
      onClose={onClose}
      title="Rename"
      footer={
        <Button
          label="Save"
          disabled={!title.trim()}
          onPress={() => {
            usePackingStore.getState().renameItem(item.id, title);
            onClose();
          }}
        />
      }
    >
      <TextField label="Item" value={title} onChangeText={setTitle} autoFocus />
    </BottomSheet>
  );
}

export default PackingScreen;
