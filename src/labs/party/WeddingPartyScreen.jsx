import React, { useMemo, useState } from 'react';

import {
  Stack,
  Row,
  Text,
  Card,
  Badge,
  Chip,
  Button,
  Checkbox,
  TextField,
  ProgressBar,
  SectionHeader,
  BottomSheet,
  EmptyState,
  useToast,
} from '@/design-system/components';
import { useWeddingStore, selectWedding } from '@/store';
import { coupleDisplayName } from '@/models';
import { formatLongDate } from '@/lib/date';

import { LabScreen } from '../shared/LabScreen';
import { selectItems } from '../shared/createCollectionStore';
import { shareText } from '../shared/share';
import { useLabPartyStore } from './store';
import {
  PARTY_ROLES,
  memberBrief,
  memberProgress,
  partySummary,
  roleLabel,
  sortMembers,
  starterTodos,
} from './model';

export default function WeddingPartyScreen() {
  const toast = useToast();
  const wedding = useWeddingStore(selectWedding);
  const members = useLabPartyStore(selectItems);
  const { add, update, remove, toggleTodo, addTodo } = useLabPartyStore.getState();

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const editing = members.find((member) => member.id === editingId) ?? null;

  const sorted = useMemo(() => sortMembers(members), [members]);
  const summary = partySummary(members);

  const sendBrief = async (member) => {
    const ok = await shareText(
      memberBrief(member, {
        coupleName: wedding ? coupleDisplayName(wedding) : 'us',
        dateText: wedding?.date ? formatLongDate(wedding.date) : '',
      }),
      'Your wedding party list'
    );
    if (!ok) toast.error('Sharing is not available here');
  };

  return (
    <LabScreen
      title="Wedding party"
      intro="Everyone standing with you, what they are on the hook for, and what they are wearing."
    >
      <Card tone="brand">
        <Stack gap="sm">
          <Text variant="h3">{`${summary.total} in the wedding party`}</Text>
          <ProgressBar
            value={summary.todosTotal ? summary.todosDone / summary.todosTotal : 0}
            label={`${summary.todosDone} of ${summary.todosTotal} jobs done`}
          />
          {summary.outfitsMissing ? (
            <Text variant="caption" color="muted">
              {`${summary.outfitsMissing} still need outfit details`}
            </Text>
          ) : null}
        </Stack>
      </Card>

      <Button label="Add someone" iconLeft="userPlus" variant="secondary" onPress={() => setAdding(true)} />

      <Stack gap="sm">
        <SectionHeader title="People" />
        {sorted.length === 0 ? (
          <EmptyState compact icon="guests" title="No one added yet" message="Start with your honor attendants." />
        ) : (
          sorted.map((member) => {
            const progress = memberProgress(member);
            return (
              <Card key={member.id} onLongPress={() => remove(member.id)} accessibilityHint="Long press to remove">
                <Stack gap="sm">
                  <Row justify="space-between" align="flex-start">
                    <Stack gap="hair" style={{ flex: 1 }}>
                      <Text variant="bodyStrong">{member.name}</Text>
                      <Text variant="caption" color="muted">
                        {member.outfit?.trim()
                          ? `${member.outfit}${member.size ? `, size ${member.size}` : ''}`
                          : 'No outfit details yet'}
                      </Text>
                    </Stack>
                    <Badge label={roleLabel(member.roleKey)} tone="brand" />
                  </Row>
                  {member.todos?.map((todo) => (
                    <Checkbox
                      key={todo.id}
                      checked={todo.done}
                      onChange={() => toggleTodo(member.id, todo.id)}
                      label={todo.title}
                    />
                  ))}
                  <Row gap="xs" justify="space-between">
                    <Text variant="caption" color="subtle">
                      {progress.total ? `${progress.done}/${progress.total} done` : ''}
                    </Text>
                    <Row gap="xs">
                      <Button size="sm" variant="ghost" fullWidth={false} label="Edit" onPress={() => setEditingId(member.id)} />
                      <Button size="sm" variant="soft" fullWidth={false} label="Send list" onPress={() => sendBrief(member)} />
                    </Row>
                  </Row>
                </Stack>
              </Card>
            );
          })
        )}
      </Stack>

      <AddMemberSheet
        visible={adding}
        onClose={() => setAdding(false)}
        onSave={(fields) => {
          add({ ...fields, todos: starterTodos(fields.roleKey), outfit: '', size: '' });
          setAdding(false);
        }}
      />

      <EditMemberSheet
        key={editingId ?? 'closed'}
        member={editing}
        onClose={() => setEditingId(null)}
        onSave={(patch) => update(editing.id, patch)}
        onAddTodo={(title) => addTodo(editing.id, title)}
      />
    </LabScreen>
  );
}

function AddMemberSheet({ visible, onClose, onSave }) {
  const [name, setName] = useState('');
  const [roleKey, setRoleKey] = useState('bridesmaid');
  const [phone, setPhone] = useState('');

  const save = () => {
    onSave({ name: name.trim(), roleKey, phone: phone.trim() });
    setName('');
    setPhone('');
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Add to the wedding party"
      footer={<Button label="Add" onPress={save} disabled={!name.trim()} />}
    >
      <Stack gap="lg">
        <TextField label="Name" value={name} onChangeText={setName} placeholder="Priya Shah" required />
        <Stack gap="xs">
          <Text variant="label">Role</Text>
          <Row gap="xs" wrap>
            {PARTY_ROLES.map((role) => (
              <Chip
                key={role.key}
                size="sm"
                label={role.label}
                selected={roleKey === role.key}
                onPress={() => setRoleKey(role.key)}
              />
            ))}
          </Row>
        </Stack>
        <TextField label="Phone (optional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      </Stack>
    </BottomSheet>
  );
}

function EditMemberSheet({ member, onClose, onSave, onAddTodo }) {
  // Remounted per member (see `key` at the call site), so this starts fresh.
  const [outfit, setOutfit] = useState(member?.outfit ?? '');
  const [size, setSize] = useState(member?.size ?? '');
  const [todo, setTodo] = useState('');

  return (
    <BottomSheet
      visible={Boolean(member)}
      onClose={onClose}
      title={member ? `Edit ${member.name}` : ''}
      footer={
        <Button
          label="Save"
          onPress={() => {
            onSave({ outfit: outfit.trim(), size: size.trim() });
            onClose();
          }}
        />
      }
    >
      <Stack gap="lg">
        <TextField label="Outfit" value={outfit} onChangeText={setOutfit} placeholder="Sage satin midi, Azazie" />
        <TextField label="Size" value={size} onChangeText={setSize} placeholder="8" />
        <Row gap="sm" align="flex-end">
          <TextField
            label="Add a job"
            value={todo}
            onChangeText={setTodo}
            placeholder="Pick up the cake"
            containerStyle={{ flex: 1 }}
          />
          <Button
            label="Add"
            size="md"
            variant="secondary"
            fullWidth={false}
            disabled={!todo.trim()}
            onPress={() => {
              onAddTodo(todo);
              setTodo('');
            }}
          />
        </Row>
      </Stack>
    </BottomSheet>
  );
}
