import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';

import {
  Badge,
  BottomSheet,
  Button,
  Card,
  Chip,
  ConfirmSheet,
  EmptyState,
  ProgressBar,
  Row,
  Screen,
  ScreenHeader,
  SegmentedControl,
  Stack,
  Text,
  TextField,
  Touchable,
  useToast,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import {
  useBudgetStore,
  useGiftStore,
  useGuestStore,
  useWeddingStore,
  selectAllGuests,
  selectBudget,
  selectGifts,
  selectWedding,
} from '@/store';
import {
  GIFT_KIND_OPTIONS,
  GiftKind,
  THANK_YOU_META,
  ThankYouStatus,
  coupleDisplayName,
  draftThankYou,
  dueLabel,
  giftsCsv,
  guestFullName,
  matchGuest,
  sortGifts,
  summariseGifts,
  thankYouDue,
  validateGift,
} from '@/models';
import { formatMoney } from '@/lib/currency';
import { todayISO } from '@/lib/date';
import { DateField } from '@/features/shared/DateField';
import { MoneyField } from '@/features/shared/MoneyField';
import { datedFilename, exportTextFile } from '@/services/files';
import { shareText } from '@/services/share';

import { importLabGifts } from './labsImport';

const FILTERS = [
  { key: 'open', label: 'To thank' },
  { key: 'sent', label: 'Thanked' },
  { key: 'all', label: 'All' },
];

/**
 * Gifts and thank-you notes (graduated from Labs): log each gift as it
 * arrives, see when its note is due, write the note from a warm first draft,
 * and mark it sent. Synced, so either partner can pick up the next note.
 */
export function GiftsScreen() {
  const toast = useToast();
  const { spacing } = useTheme();
  const wedding = useWeddingStore(selectWedding);
  const budget = useBudgetStore(selectBudget);
  const guests = useGuestStore(selectAllGuests);
  const gifts = useGiftStore(selectGifts);
  const { setThankYou } = useGiftStore.getState();

  const [filter, setFilter] = useState('open');
  const [editing, setEditing] = useState(null);
  const [writing, setWriting] = useState(null);

  useEffect(() => {
    importLabGifts({ weddingId: wedding?.id ?? null });
  }, [wedding?.id]);

  const currency = budget?.currency ?? wedding?.currency;
  const context = useMemo(() => ({ weddingDate: wedding?.date ?? null }), [wedding?.date]);
  const summary = summariseGifts(gifts);
  const overdue = gifts.filter((gift) => thankYouDue(gift, context).overdue).length;
  const shown = useMemo(() => {
    const list =
      filter === 'open'
        ? gifts.filter((gift) => gift.thankYouStatus !== ThankYouStatus.SENT)
        : filter === 'sent'
          ? gifts.filter((gift) => gift.thankYouStatus === ThankYouStatus.SENT)
          : gifts;
    return sortGifts(list, context);
  }, [gifts, filter, context]);

  const exportCsv = async () => {
    const result = await exportTextFile({
      filename: datedFilename('gifts'),
      text: giftsCsv(gifts, { weddingDate: context.weddingDate, currency }),
      title: 'Gifts',
    });
    if (result === 'downloaded') toast.success('Gift list downloaded');
    else if (result === 'failed') toast.error('Could not export the list');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen
        bottomInset={spacing.xxl}
        footer={<Button label="Log a gift" iconLeft="plus" onPress={() => setEditing({ gift: null })} />}
      >
        <Stack gap="lg">
          <ScreenHeader eyebrow="Guests" title="Gifts and thank-yous" />

          {gifts.length ? (
            <Card tone="raised">
              <Stack gap="sm">
                <Text variant="h3">{`${summary.sent} of ${summary.total} thanked`}</Text>
                <ProgressBar value={summary.progress} />
                <Text variant="bodySm" color={overdue ? 'danger' : 'muted'}>
                  {[
                    summary.toWrite ? `${summary.toWrite} still to write` : 'Every note is sent',
                    overdue ? `${overdue} overdue` : null,
                    summary.money ? `${formatMoney(summary.money, currency)} in money gifts` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </Stack>
            </Card>
          ) : null}

          {gifts.length ? (
            <Row gap="xs" wrap align="flex-start">
              {FILTERS.map((entry) => (
                <Chip
                  key={entry.key}
                  label={entry.label}
                  selected={filter === entry.key}
                  onPress={() => setFilter(entry.key)}
                />
              ))}
            </Row>
          ) : null}

          {gifts.length === 0 ? (
            <EmptyState
              icon="heart"
              title="No gifts logged yet"
              message="Add each gift as it arrives. We will tell you when its thank-you is due and help you write it."
              actionLabel="Log a gift"
              onAction={() => setEditing({ gift: null })}
            />
          ) : shown.length === 0 ? (
            <EmptyState
              compact
              icon="check"
              title={filter === 'open' ? 'Every gift is thanked' : 'No thank-yous sent yet'}
              actionLabel="Show all"
              onAction={() => setFilter('all')}
            />
          ) : (
            <Stack gap="sm">
              {shown.map((gift) => (
                <GiftCard
                  key={gift.id}
                  gift={gift}
                  due={thankYouDue(gift, context)}
                  currency={currency}
                  onEdit={() => setEditing({ gift })}
                  onWrite={() => setWriting(gift)}
                  onThanked={() => {
                    setThankYou(gift.id, ThankYouStatus.SENT);
                    toast.success(`${gift.fromName} thanked`, {
                      actionLabel: 'Undo',
                      onAction: () => setThankYou(gift.id, gift.thankYouStatus),
                    });
                  }}
                />
              ))}
            </Stack>
          )}

          {gifts.length ? (
            <Button label="Export as CSV" variant="ghost" iconLeft="send" onPress={exportCsv} />
          ) : null}
        </Stack>

        {editing ? (
          <GiftSheet
            gift={editing.gift}
            guests={guests}
            currency={currency}
            weddingId={wedding?.id ?? null}
            onClose={() => setEditing(null)}
          />
        ) : null}

        {writing ? (
          <NoteSheet
            gift={writing}
            coupleName={wedding ? coupleDisplayName(wedding) : 'Us'}
            onClose={() => setWriting(null)}
          />
        ) : null}
      </Screen>
    </KeyboardAvoidingView>
  );
}

function GiftCard({ gift, due, currency, onEdit, onWrite, onThanked }) {
  const meta = THANK_YOU_META[gift.thankYouStatus] ?? THANK_YOU_META[ThankYouStatus.TODO];
  const sent = gift.thankYouStatus === ThankYouStatus.SENT;
  return (
    <Card onPress={onEdit} accessibilityLabel={`Edit the gift from ${gift.fromName}`}>
      <Stack gap="sm">
        <Row justify="space-between" align="flex-start" gap="sm">
          <Stack gap="hair" style={{ flex: 1 }}>
            <Text variant="bodyStrong">{gift.fromName}</Text>
            {gift.description || gift.value ? (
              <Text variant="caption" color="muted">
                {[gift.description, gift.value ? formatMoney(gift.value, currency) : null]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            ) : null}
          </Stack>
          <Badge label={due.overdue ? 'Overdue' : meta.label} tone={due.overdue ? 'danger' : meta.tone} />
        </Row>
        {sent ? null : (
          <Row justify="space-between" align="center" gap="sm">
            <Text variant="caption" color={due.overdue ? 'danger' : 'subtle'} style={{ flex: 1 }}>
              {dueLabel(due)}
            </Text>
            <Button
              size="sm"
              variant="secondary"
              fullWidth={false}
              label={gift.note ? 'Edit note' : 'Write note'}
              onPress={onWrite}
            />
            <Touchable onPress={onThanked} accessibilityLabel={`Mark ${gift.fromName} as thanked`}>
              <Badge label="Thanked" icon="check" tone="success" />
            </Touchable>
          </Row>
        )}
      </Stack>
    </Card>
  );
}

/** Add or edit one gift. */
function GiftSheet({ gift, guests, currency, weddingId, onClose }) {
  const toast = useToast();
  const { addGift, updateGift, removeGift } = useGiftStore.getState();
  const [fromName, setFromName] = useState(gift?.fromName ?? '');
  const [kind, setKind] = useState(gift?.kind ?? GiftKind.ITEM);
  const [description, setDescription] = useState(gift?.description ?? '');
  const [value, setValue] = useState(gift?.value || null);
  const [receivedOn, setReceivedOn] = useState(gift?.receivedOn ?? todayISO());
  const [errors, setErrors] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Suggest guests as the name is typed, so the note can use their first name.
  const suggestions = useMemo(() => {
    const needle = fromName.trim().toLowerCase();
    if (needle.length < 2) return [];
    return guests
      .filter((guest) => guestFullName(guest).toLowerCase().includes(needle))
      .filter((guest) => guestFullName(guest).toLowerCase() !== needle)
      .slice(0, 4);
  }, [guests, fromName]);

  const save = () => {
    const fields = {
      fromName: fromName.trim(),
      kind,
      description: description.trim(),
      value: value ?? 0,
      receivedOn,
    };
    const nextErrors = validateGift(fields);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    const guestId = matchGuest(fields.fromName, guests)?.id ?? null;
    if (gift) {
      updateGift(gift.id, { ...fields, guestId });
      toast.success('Gift saved');
    } else if (addGift({ ...fields, guestId, weddingId })) {
      toast.success(`Gift from ${fields.fromName} logged`);
    } else {
      toast.error('That is the most gifts the list can hold.');
      return;
    }
    onClose();
  };

  return (
    <>
      <BottomSheet
        visible={!confirmDelete}
        onClose={onClose}
        title={gift ? 'Edit gift' : 'Log a gift'}
        footer={
          <Stack gap="xs">
            <Button label={gift ? 'Save gift' : 'Log gift'} onPress={save} />
            {gift ? (
              <Button label="Delete gift" variant="ghost" onPress={() => setConfirmDelete(true)} />
            ) : null}
          </Stack>
        }
      >
        <Stack gap="md">
          <TextField
            label="From"
            value={fromName}
            onChangeText={(next) => {
              setFromName(next);
              if (errors.fromName) setErrors((current) => ({ ...current, fromName: undefined }));
            }}
            placeholder="Aunt Maria"
            error={errors.fromName}
            autoCapitalize="words"
            required
          />
          {suggestions.length ? (
            <Row gap="xs" wrap align="flex-start">
              {suggestions.map((guest) => (
                <Chip
                  key={guest.id}
                  label={guestFullName(guest)}
                  size="sm"
                  onPress={() => setFromName(guestFullName(guest))}
                />
              ))}
            </Row>
          ) : null}
          <SegmentedControl options={GIFT_KIND_OPTIONS} value={kind} onChange={setKind} />
          <TextField
            label={kind === GiftKind.MONEY ? 'Towards (optional)' : 'What was it?'}
            value={description}
            onChangeText={setDescription}
            placeholder={kind === GiftKind.MONEY ? 'our honeymoon' : 'the stand mixer'}
            error={errors.description}
          />
          <MoneyField
            label="Value (optional)"
            value={value}
            onChange={setValue}
            currency={currency}
            error={errors.value}
          />
          <DateField label="Received on" value={receivedOn} onChange={setReceivedOn} />
        </Stack>
      </BottomSheet>

      {gift ? (
        <ConfirmSheet
          visible={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          onConfirm={() => {
            removeGift(gift.id);
            toast.info('Gift deleted');
            onClose();
          }}
          title="Delete this gift?"
          message={`The gift from ${gift.fromName} and its note will be removed. This cannot be undone.`}
          confirmLabel="Delete"
          destructive
          icon="trash"
        />
      ) : null}
    </>
  );
}

/**
 * Write the thank-you: starts from a draft that names the gift, saves as the
 * couple edits, and can be shared to wherever they actually write notes.
 */
function NoteSheet({ gift, coupleName, onClose }) {
  const toast = useToast();
  const { updateGift } = useGiftStore.getState();
  const [note, setNote] = useState(gift.note || draftThankYou({ gift, coupleName }));
  const error = validateGift({ ...gift, note }).note;

  const keep = (status) => {
    if (error) return false;
    updateGift(gift.id, {
      note,
      thankYouStatus:
        status ??
        (gift.thankYouStatus === ThankYouStatus.TODO ? ThankYouStatus.DRAFTED : gift.thankYouStatus),
    });
    return true;
  };

  const share = async () => {
    if (!keep()) return;
    if (!(await shareText(note, 'Thank you')))
      toast.error('Sharing is not available here. The note is saved.');
  };

  return (
    <BottomSheet
      visible
      onClose={() => {
        keep();
        onClose();
      }}
      title={`Thank ${gift.fromName}`}
      subtitle="A starting point - make it yours. It saves when you leave."
      footer={
        <Stack gap="xs">
          <Button
            label="Mark as sent"
            iconLeft="check"
            onPress={() => {
              if (keep(ThankYouStatus.SENT)) {
                toast.success(`${gift.fromName} thanked`);
                onClose();
              }
            }}
          />
          <Row gap="xs">
            <Button label="Share" variant="secondary" iconLeft="send" style={{ flex: 1 }} onPress={share} />
            <Button
              label="Save draft"
              variant="secondary"
              style={{ flex: 1 }}
              onPress={() => {
                if (keep()) onClose();
              }}
            />
          </Row>
        </Stack>
      }
    >
      <TextField
        label="Note"
        value={note}
        onChangeText={setNote}
        multiline
        numberOfLines={10}
        error={error}
        autoCapitalize="sentences"
      />
    </BottomSheet>
  );
}

export default GiftsScreen;
