import React, { useMemo, useState } from 'react';

import {
  Stack,
  Row,
  Text,
  Card,
  Badge,
  Button,
  TextField,
  ProgressBar,
  SectionHeader,
  SegmentedControl,
  BottomSheet,
  EmptyState,
  Touchable,
  useToast,
} from '@/design-system/components';
import { useGuestStore, useWeddingStore, selectAllGuests, selectWedding } from '@/store';
import { coupleDisplayName } from '@/models';
import { formatMoney, parseMoneyInput } from '@/lib/currency';
import { isValidISODate, todayISO } from '@/lib/date';

import { LabScreen } from '../shared/LabScreen';
import { selectItems } from '../shared/createCollectionStore';
import { shareText } from '../shared/share';
import { useLabGiftStore } from './store';
import {
  GIFT_KIND_OPTIONS,
  GiftKind,
  THANK_YOU_META,
  ThankYouStatus,
  draftThankYou,
  dueLabel,
  matchGuest,
  sortGifts,
  summariseGifts,
  thankYouDue,
} from './model';

export default function GiftTrackerScreen() {
  const toast = useToast();
  const guests = useGuestStore(selectAllGuests);
  const wedding = useWeddingStore(selectWedding);
  const gifts = useLabGiftStore(selectItems);
  const { add, update, remove, cycleThankYou } = useLabGiftStore.getState();
  const [adding, setAdding] = useState(false);

  const context = useMemo(() => ({ weddingDate: wedding?.date ?? null }), [wedding?.date]);
  const sorted = useMemo(() => sortGifts(gifts, context), [gifts, context]);
  const summary = summariseGifts(gifts);
  const coupleName = wedding ? coupleDisplayName(wedding) : 'Us';

  const draft = async (gift) => {
    const ok = await shareText(draftThankYou({ gift, coupleName }), 'Thank you');
    if (!ok) {
      toast.error('Sharing is not available here');
      return;
    }
    if (gift.thankYouStatus === ThankYouStatus.TODO) update(gift.id, { thankYouStatus: ThankYouStatus.DRAFTED });
  };

  return (
    <LabScreen
      title="Gifts and thank-yous"
      intro="Log gifts as they arrive and never miss a thank-you note. Drafts are a starting point - make them yours."
    >
      <Card tone="brand">
        <Stack gap="sm">
          <Text variant="h3">
            {summary.sent} of {summary.total} thanked
          </Text>
          <ProgressBar value={summary.progress} />
          {summary.money > 0 ? (
            <Text variant="caption" color="muted">
              {`${formatMoney(summary.money)} in money gifts`}
            </Text>
          ) : null}
        </Stack>
      </Card>

      <Button label="Log a gift" iconLeft="plus" variant="secondary" onPress={() => setAdding(true)} />

      <Stack gap="sm">
        <SectionHeader title="Gifts" subtitle="Tap the status to move it along. Long press to delete." />
        {sorted.length === 0 ? (
          <EmptyState compact icon="heart" title="No gifts logged yet" message="Add each one as it arrives." />
        ) : (
          sorted.map((gift) => {
            const due = thankYouDue(gift, context);
            const meta = THANK_YOU_META[gift.thankYouStatus ?? ThankYouStatus.TODO];
            return (
              <Card key={gift.id} onLongPress={() => remove(gift.id)} accessibilityHint="Long press to delete">
                <Stack gap="sm">
                  <Row justify="space-between" align="flex-start">
                    <Stack gap="hair" style={{ flex: 1 }}>
                      <Text variant="bodyStrong">{gift.fromName}</Text>
                      <Text variant="caption" color="muted">
                        {[gift.description, gift.value ? formatMoney(gift.value) : null].filter(Boolean).join(' - ')}
                      </Text>
                    </Stack>
                    <Touchable
                      onPress={() => cycleThankYou(gift.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Status: ${meta.label}. Tap to change.`}
                    >
                      <Badge label={meta.label} tone={due.overdue ? 'danger' : meta.tone} />
                    </Touchable>
                  </Row>
                  {gift.thankYouStatus !== ThankYouStatus.SENT ? (
                    <Row justify="space-between">
                      <Text variant="caption" color={due.overdue ? 'danger' : 'subtle'}>
                        {dueLabel(due)}
                      </Text>
                      <Button size="sm" variant="soft" fullWidth={false} label="Draft note" onPress={() => draft(gift)} />
                    </Row>
                  ) : null}
                </Stack>
              </Card>
            );
          })
        )}
      </Stack>

      <AddGiftSheet
        visible={adding}
        onClose={() => setAdding(false)}
        onSave={(fields) => {
          add({ ...fields, guestId: matchGuest(fields.fromName, guests)?.id ?? null });
          setAdding(false);
        }}
      />
    </LabScreen>
  );
}

function AddGiftSheet({ visible, onClose, onSave }) {
  const [fromName, setFromName] = useState('');
  const [kind, setKind] = useState(GiftKind.ITEM);
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [receivedOn, setReceivedOn] = useState(todayISO());

  const dateError = receivedOn && !isValidISODate(receivedOn) ? 'Use YYYY-MM-DD' : '';

  const save = () => {
    onSave({
      fromName: fromName.trim(),
      kind,
      description: description.trim(),
      value: parseMoneyInput(value) ?? 0,
      receivedOn: receivedOn || todayISO(),
      thankYouStatus: ThankYouStatus.TODO,
    });
    setFromName('');
    setDescription('');
    setValue('');
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Log a gift"
      footer={<Button label="Save gift" onPress={save} disabled={!fromName.trim() || Boolean(dateError)} />}
    >
      <Stack gap="lg">
        <TextField label="From" value={fromName} onChangeText={setFromName} placeholder="Aunt Maria" required />
        <SegmentedControl options={GIFT_KIND_OPTIONS} value={kind} onChange={setKind} />
        <TextField
          label={kind === GiftKind.MONEY ? 'Towards (optional)' : 'What was it?'}
          value={description}
          onChangeText={setDescription}
          placeholder={kind === GiftKind.MONEY ? 'our honeymoon' : 'the stand mixer'}
        />
        <TextField
          label="Value (optional)"
          value={value}
          onChangeText={setValue}
          prefix="$"
          keyboardType="decimal-pad"
        />
        <TextField
          label="Received on"
          value={receivedOn}
          onChangeText={setReceivedOn}
          placeholder="2027-06-01"
          error={dateError}
        />
      </Stack>
    </BottomSheet>
  );
}
