import React, { useMemo, useState } from 'react';

import {
  Stack,
  Row,
  Text,
  Card,
  Button,
  TextField,
  SectionHeader,
  BottomSheet,
  EmptyState,
  ConfirmSheet,
  useToast,
} from '@/design-system/components';
import { useWeddingStore, selectWedding } from '@/store';
import { coupleDisplayName } from '@/models';

import { LabScreen } from '../shared/LabScreen';
import { selectItems } from '../shared/createCollectionStore';
import { shareText } from '../shared/share';
import { useLabTimelineStore } from './store';
import {
  endOf,
  findOverlaps,
  formatDuration,
  formatTime,
  parseTime,
  sortEvents,
  timelineText,
} from './model';

export default function DayTimelineScreen() {
  const toast = useToast();
  const wedding = useWeddingStore(selectWedding);
  const events = useLabTimelineStore(selectItems);
  const { add, remove, reset, loadSample, shift } = useLabTimelineStore.getState();

  const [adding, setAdding] = useState(false);
  const [clearing, setClearing] = useState(false);

  const sorted = useMemo(() => sortEvents(events), [events]);
  const overlaps = useMemo(() => findOverlaps(events), [events]);
  const overlapping = new Set(overlaps.flatMap((pair) => [pair.first.id, pair.second.id]));

  const share = async () => {
    const title = wedding ? `${coupleDisplayName(wedding)}'s wedding` : 'Wedding day';
    const ok = await shareText(timelineText(events, { title }), 'Run of show');
    if (!ok) toast.error('Sharing is not available here');
  };

  const push = (event, minutes) => {
    const moved = shift(event.id, minutes);
    if (moved) toast.info(`Moved ${moved} event${moved === 1 ? '' : 's'} ${minutes > 0 ? 'later' : 'earlier'}`);
  };

  return (
    <LabScreen
      title="Day-of timeline"
      intro="Your run of show, minute by minute. Running late? Push an event and everything after it moves too."
    >
      {sorted.length === 0 ? (
        <EmptyState
          icon="clock"
          title="Plan the day hour by hour"
          message="Start from a typical wedding day and make it yours, or add your own events."
          actionLabel="Load a sample day"
          onAction={loadSample}
          secondaryActionLabel="Add an event"
          onSecondaryAction={() => setAdding(true)}
        />
      ) : (
        <>
          <Row gap="xs">
            <Button label="Add event" iconLeft="plus" variant="secondary" fullWidth={false} onPress={() => setAdding(true)} />
            <Button label="Share" iconLeft="send" variant="secondary" fullWidth={false} onPress={share} />
          </Row>

          {overlaps.length ? (
            <Card tone="danger">
              <Stack gap="xxs">
                <Text variant="bodyStrong">Overlapping events</Text>
                {overlaps.map(({ first, second }) => (
                  <Text key={`${first.id}-${second.id}`} variant="bodySm">
                    {`${second.title} starts before ${first.title} ends (${formatTime(endOf(first))})`}
                  </Text>
                ))}
              </Stack>
            </Card>
          ) : null}

          <Stack gap="sm">
            <SectionHeader
              title="Run of show"
              actionLabel="Clear"
              actionIcon="trash"
              onActionPress={() => setClearing(true)}
            />
            {sorted.map((event) => (
              <Card
                key={event.id}
                tone={overlapping.has(event.id) ? 'accent' : 'plain'}
                onLongPress={() => remove(event.id)}
                accessibilityHint="Long press to delete"
              >
                <Row gap="md" align="flex-start">
                  <Stack gap="hair" style={{ width: 76 }}>
                    <Text variant="labelStrong">{formatTime(event.start)}</Text>
                    <Text variant="caption" color="subtle">
                      {formatDuration(event.durationMin)}
                    </Text>
                  </Stack>
                  <Stack gap="xs" style={{ flex: 1 }}>
                    <Text variant="bodyStrong">{event.title}</Text>
                    {event.location || event.owner ? (
                      <Text variant="caption" color="muted">
                        {[event.location, event.owner].filter(Boolean).join(' - ')}
                      </Text>
                    ) : null}
                    <Row gap="xs">
                      <Button size="sm" variant="ghost" fullWidth={false} label="-15m" onPress={() => push(event, -15)} />
                      <Button size="sm" variant="ghost" fullWidth={false} label="+15m" onPress={() => push(event, 15)} />
                    </Row>
                  </Stack>
                </Row>
              </Card>
            ))}
          </Stack>
        </>
      )}

      <AddEventSheet
        visible={adding}
        onClose={() => setAdding(false)}
        onSave={(fields) => {
          add(fields);
          setAdding(false);
        }}
      />

      <ConfirmSheet
        visible={clearing}
        onClose={() => setClearing(false)}
        onConfirm={() => {
          reset();
          setClearing(false);
        }}
        title="Clear the whole timeline?"
        confirmLabel="Clear"
        destructive
      />
    </LabScreen>
  );
}

function AddEventSheet({ visible, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('');
  const [duration, setDuration] = useState('30');
  const [location, setLocation] = useState('');
  const [owner, setOwner] = useState('');

  const startMinutes = parseTime(start);
  const startError = start && startMinutes === null ? 'Try 4:30 PM or 16:30' : '';

  const save = () => {
    onSave({
      title: title.trim(),
      start: startMinutes,
      durationMin: Math.max(0, Number(duration) || 0),
      location: location.trim(),
      owner: owner.trim(),
    });
    setTitle('');
    setStart('');
    setLocation('');
    setOwner('');
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Add an event"
      footer={<Button label="Save event" onPress={save} disabled={!title.trim() || startMinutes === null} />}
    >
      <Stack gap="lg">
        <TextField label="What" value={title} onChangeText={setTitle} placeholder="Cake cutting" required />
        <Row gap="sm" align="flex-start">
          <TextField
            label="Starts"
            value={start}
            onChangeText={setStart}
            placeholder="8:45 PM"
            error={startError}
            containerStyle={{ flex: 1 }}
          />
          <TextField
            label="Minutes"
            value={duration}
            onChangeText={setDuration}
            keyboardType="number-pad"
            containerStyle={{ flex: 1 }}
          />
        </Row>
        <TextField label="Where (optional)" value={location} onChangeText={setLocation} placeholder="Garden terrace" />
        <TextField label="Who runs it (optional)" value={owner} onChangeText={setOwner} placeholder="Caterer" />
      </Stack>
    </BottomSheet>
  );
}
