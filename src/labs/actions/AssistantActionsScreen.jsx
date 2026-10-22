import React, { useState } from 'react';

import {
  Stack,
  Row,
  Text,
  Card,
  Badge,
  Chip,
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
  selectWedding,
  selectAllGuests,
  selectAllBudgetCategories,
} from '@/store';
import { formatRelativeDay, toISODate } from '@/lib/date';

import { LabScreen } from '../shared/LabScreen';
import { selectItems } from '../shared/createCollectionStore';
import { useLabActionStore } from './store';
import { ActionKind, EXAMPLES, parseCommand } from './model';

const KIND_LABEL = {
  [ActionKind.ADD_EXPENSE]: { label: 'Budget', tone: 'accent' },
  [ActionKind.SET_RSVP]: { label: 'Guests', tone: 'info' },
  [ActionKind.ADD_TASK]: { label: 'Planning', tone: 'brand' },
  [ActionKind.UNKNOWN]: { label: 'Not understood', tone: 'neutral' },
};

export default function AssistantActionsScreen() {
  const toast = useToast();
  const wedding = useWeddingStore(selectWedding);
  const guests = useGuestStore(selectAllGuests);
  const categories = useBudgetStore(selectAllBudgetCategories);
  const history = useLabActionStore(selectItems);
  const log = useLabActionStore((state) => state.add);

  const [text, setText] = useState('');
  const [proposal, setProposal] = useState(null);
  const [title, setTitle] = useState('');

  const preview = (input = text) => {
    const parsed = parseCommand(input, { guests, categories });
    setProposal(parsed);
    setTitle(parsed?.payload?.title ?? '');
  };

  const apply = () => {
    if (!proposal?.ready || !wedding) return;
    const { kind, payload } = proposal;

    if (kind === ActionKind.ADD_EXPENSE) {
      useBudgetStore.getState().addExpense({ ...payload, title: title.trim() || payload.title, weddingId: wedding.id });
    } else if (kind === ActionKind.SET_RSVP) {
      const { setRsvp } = useGuestStore.getState();
      for (const guestId of payload.guestIds) setRsvp(guestId, payload.rsvpStatus);
    } else if (kind === ActionKind.ADD_TASK) {
      usePlanningStore
        .getState()
        .addTask({ weddingId: wedding.id, title: title.trim() || payload.title, dueDate: payload.dueDate });
    }

    log({ kind, input: text.trim(), summary: proposal.summary });
    toast.success('Done - check the tab to see it');
    setProposal(null);
    setText('');
  };

  const editable = proposal && (proposal.kind === ActionKind.ADD_EXPENSE || proposal.kind === ActionKind.ADD_TASK);

  return (
    <LabScreen
      title="Assistant actions"
      intro="Ask for a change in plain words. You see exactly what will happen first, and nothing changes until you tap Apply."
    >
      <Stack gap="sm">
        <TextField
          label="What should change?"
          value={text}
          onChangeText={(value) => {
            setText(value);
            setProposal(null);
          }}
          placeholder="Add a $2,000 florist expense"
          onSubmitEditing={() => preview()}
          returnKeyType="go"
        />
        <Button label="Preview" variant="secondary" onPress={() => preview()} disabled={!text.trim()} />
        <Row gap="xs" wrap>
          {EXAMPLES.map((example) => (
            <Chip
              key={example}
              size="sm"
              label={example}
              onPress={() => {
                setText(example);
                preview(example);
              }}
            />
          ))}
        </Row>
      </Stack>

      {proposal ? (
        <Card tone={proposal.ready ? 'brand' : 'muted'}>
          <Stack gap="sm">
            <Row>
              <Badge label={KIND_LABEL[proposal.kind].label} tone={KIND_LABEL[proposal.kind].tone} />
            </Row>
            <Text variant="bodyStrong">{proposal.summary}</Text>
            {proposal.warnings.map((warning) => (
              <Text key={warning} variant="caption" color="warning">
                {warning}
              </Text>
            ))}
            {editable ? <TextField label="Title" value={title} onChangeText={setTitle} /> : null}
            {!wedding ? (
              <Text variant="caption" color="danger">
                Finish onboarding first - there is no wedding to change yet.
              </Text>
            ) : null}
            <Row gap="xs">
              <Button
                label="Apply"
                fullWidth={false}
                onPress={apply}
                disabled={!proposal.ready || !wedding}
              />
              <Button label="Cancel" variant="ghost" fullWidth={false} onPress={() => setProposal(null)} />
            </Row>
          </Stack>
        </Card>
      ) : null}

      {history.length ? (
        <Stack gap="sm">
          <SectionHeader title="Applied" />
          <Card padding="none">
            {[...history].reverse().slice(0, 10).map((entry) => (
              <ListRow
                key={entry.id}
                title={entry.summary}
                subtitle={`"${entry.input}" - ${formatRelativeDay(toISODate(new Date(entry.createdAt))).toLowerCase()}`}
                showChevron={false}
              />
            ))}
          </Card>
        </Stack>
      ) : null}
    </LabScreen>
  );
}
