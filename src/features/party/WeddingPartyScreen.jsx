import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';

import {
  Badge,
  BottomSheet,
  Button,
  Card,
  Checkbox,
  Chip,
  ConfirmSheet,
  EmptyState,
  Icon,
  ListRow,
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
  useGuestStore,
  usePartyStore,
  useWeddingStore,
  selectAllGuests,
  selectPartyMembers,
  selectWedding,
} from '@/store';
import {
  PARTY_LIMITS,
  PARTY_ROLES,
  coupleDisplayName,
  guestFullName,
  memberBrief,
  memberFromGuest,
  memberProgress,
  partySummary,
  roleLabel,
  sortMembers,
  validatePartyMember,
} from '@/models';
import { formatLongDate } from '@/lib/date';
import { shareText } from '@/services/share';

import { importLabParty } from './labsImport';

/**
 * The wedding party (graduated from Labs): everyone standing with the couple,
 * the jobs each role usually covers, outfits and sizes, and a message with
 * each person's list to send them. Synced, so both partners see the same list.
 */
export function WeddingPartyScreen() {
  const toast = useToast();
  const { spacing } = useTheme();
  const wedding = useWeddingStore(selectWedding);
  const guests = useGuestStore(selectAllGuests);
  const members = usePartyStore(selectPartyMembers);
  const { toggleTodo } = usePartyStore.getState();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const editing = members.find((member) => member.id === editingId) ?? null;

  useEffect(() => {
    importLabParty({ weddingId: wedding?.id ?? null });
  }, [wedding?.id]);

  const sorted = useMemo(() => sortMembers(members), [members]);
  const summary = partySummary(members);
  const full = members.length >= PARTY_LIMITS.members;

  const sendList = async (member) => {
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen
        bottomInset={spacing.xxl}
        footer={
          <Button
            label={full ? `${PARTY_LIMITS.members} is the most the list holds` : 'Add someone'}
            iconLeft="userPlus"
            disabled={full}
            onPress={() => setAdding(true)}
          />
        }
      >
        <Stack gap="lg">
          <ScreenHeader eyebrow="Guests" title="Wedding party" />

          {members.length ? (
            <Card tone="raised">
              <Stack gap="sm">
                <Text variant="h3">{`${summary.total} in the wedding party`}</Text>
                <ProgressBar value={summary.todosTotal ? summary.todosDone / summary.todosTotal : 0} />
                <Text variant="bodySm" color="muted">
                  {[
                    `${summary.todosDone} of ${summary.todosTotal} jobs done`,
                    summary.outfitsMissing ? `${summary.outfitsMissing} still need outfit details` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </Stack>
            </Card>
          ) : (
            <EmptyState
              icon="star"
              title="Who is standing with you?"
              message="Add your wedding party - from your guest list or by name. Each role comes with the jobs it usually covers, and you can send everyone their list."
              actionLabel="Add someone"
              onAction={() => setAdding(true)}
            />
          )}

          {sorted.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              onToggle={(todoId) => toggleTodo(member.id, todoId)}
              onEdit={() => setEditingId(member.id)}
              onSend={() => sendList(member)}
            />
          ))}
        </Stack>

        {adding ? (
          <AddMemberSheet
            guests={guests}
            members={members}
            weddingId={wedding?.id ?? null}
            onClose={() => setAdding(false)}
          />
        ) : null}

        {editing ? (
          <EditMemberSheet key={editing.id} member={editing} onClose={() => setEditingId(null)} />
        ) : null}
      </Screen>
    </KeyboardAvoidingView>
  );
}

function MemberCard({ member, onToggle, onEdit, onSend }) {
  const progress = memberProgress(member);
  const details = member.outfit
    ? `${member.outfit}${member.size ? `, size ${member.size}` : ''}`
    : 'No outfit details yet';
  return (
    <Card>
      <Stack gap="sm">
        <Row justify="space-between" align="flex-start" gap="sm">
          <Stack gap="hair" style={{ flex: 1 }}>
            <Text variant="bodyStrong">{member.name}</Text>
            <Text variant="caption" color="muted">
              {details}
            </Text>
          </Stack>
          <Badge label={roleLabel(member.roleKey)} tone="brand" />
        </Row>
        {(member.todos ?? []).map((todo) => (
          // Checkbox only labels itself for screen readers, so the title is drawn beside it.
          <Touchable
            key={todo.id}
            onPress={() => onToggle(todo.id)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: todo.done }}
            accessibilityLabel={todo.title}
            scaleOnPress={false}
          >
            <Row gap="sm" align="center">
              <Checkbox checked={todo.done} onChange={() => onToggle(todo.id)} round={false} size={20} />
              <Text
                variant="body"
                color={todo.done ? 'subtle' : 'default'}
                style={[{ flex: 1 }, todo.done ? { textDecorationLine: 'line-through' } : null]}
              >
                {todo.title}
              </Text>
            </Row>
          </Touchable>
        ))}
        <Row justify="space-between" align="center" gap="xs">
          <Text variant="caption" color="subtle">
            {progress.total ? `${progress.done} of ${progress.total} done` : 'No jobs yet'}
          </Text>
          <Row gap="xs">
            <Button
              size="sm"
              variant="ghost"
              fullWidth={false}
              label="Edit"
              accessibilityLabel={`Edit ${member.name}`}
              onPress={onEdit}
            />
            <Button
              size="sm"
              variant="secondary"
              fullWidth={false}
              label="Send list"
              accessibilityLabel={`Send ${member.name} their list`}
              onPress={onSend}
            />
          </Row>
        </Row>
      </Stack>
    </Card>
  );
}

function RolePicker({ value, onChange }) {
  return (
    <Stack gap="xs">
      <Text variant="label">Role</Text>
      <Row gap="xs" wrap align="flex-start">
        {PARTY_ROLES.map((role) => (
          <Chip
            key={role.key}
            size="sm"
            label={role.label}
            selected={value === role.key}
            onPress={() => onChange(role.key)}
          />
        ))}
      </Row>
    </Stack>
  );
}

const SOURCES = [
  { value: 'guests', label: 'From guest list' },
  { value: 'new', label: 'Someone new' },
];

/** Add from the guest list (keeping their contact details) or by name. */
function AddMemberSheet({ guests, members, weddingId, onClose }) {
  const toast = useToast();
  const { addMember } = usePartyStore.getState();
  const [source, setSource] = useState(guests.length ? 'guests' : 'new');
  const [roleKey, setRoleKey] = useState('bridesmaid');
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});

  const inParty = new Set(members.map((member) => member.guestId).filter(Boolean));
  const needle = query.trim().toLowerCase();
  const candidates = guests
    .filter((guest) => !inParty.has(guest.id))
    .filter((guest) => !needle || guestFullName(guest).toLowerCase().includes(needle))
    .slice(0, 30);

  const added = (member) => {
    toast.success(`${member.name} added as ${roleLabel(member.roleKey).toLowerCase()}`);
    onClose();
  };

  const addGuest = (guest) => {
    const member = addMember(memberFromGuest(guest, { weddingId, roleKey }));
    if (member) added(member);
  };

  const addNew = () => {
    const fields = { name, phone, email };
    const nextErrors = validatePartyMember(fields);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    const member = addMember({ weddingId, roleKey, ...fields });
    if (member) added(member);
  };

  return (
    <BottomSheet
      visible
      onClose={onClose}
      title="Add to the wedding party"
      footer={source === 'new' ? <Button label="Add" onPress={addNew} /> : null}
    >
      <Stack gap="md">
        <RolePicker value={roleKey} onChange={setRoleKey} />
        <SegmentedControl options={SOURCES} value={source} onChange={setSource} />
        {source === 'guests' ? (
          <Stack gap="xs">
            <TextField label="Search guests" value={query} onChangeText={setQuery} placeholder="Name" />
            {candidates.length ? (
              candidates.map((guest) => (
                <ListRow
                  key={guest.id}
                  inset={false}
                  title={guestFullName(guest)}
                  subtitle={guest.phone || guest.email || undefined}
                  trailing={<Icon name="plus" size="sm" color="brand" />}
                  showChevron={false}
                  onPress={() => addGuest(guest)}
                />
              ))
            ) : (
              <Text variant="bodySm" color="muted">
                {guests.length
                  ? 'No guest matches, or they are already in the party.'
                  : 'Your guest list is empty.'}
              </Text>
            )}
          </Stack>
        ) : (
          <Stack gap="md">
            <TextField
              label="Name"
              value={name}
              onChangeText={setName}
              placeholder="Priya Shah"
              error={errors.name}
              autoCapitalize="words"
              required
            />
            <TextField
              label="Phone (optional)"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <TextField
              label="Email (optional)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
          </Stack>
        )}
      </Stack>
    </BottomSheet>
  );
}

/** Everything about one member: role, contact, outfit, and their jobs. */
function EditMemberSheet({ member, onClose }) {
  const toast = useToast();
  const { updateMember, removeMember, addTodo, removeTodo } = usePartyStore.getState();
  const [name, setName] = useState(member.name);
  const [roleKey, setRoleKey] = useState(member.roleKey);
  const [phone, setPhone] = useState(member.phone ?? '');
  const [email, setEmail] = useState(member.email ?? '');
  const [outfit, setOutfit] = useState(member.outfit ?? '');
  const [size, setSize] = useState(member.size ?? '');
  const [todo, setTodo] = useState('');
  const [errors, setErrors] = useState({});
  const [confirmRemove, setConfirmRemove] = useState(false);

  const save = () => {
    const fields = {
      name: name.trim(),
      roleKey,
      phone: phone.trim(),
      email: email.trim(),
      outfit: outfit.trim(),
      size: size.trim(),
    };
    const nextErrors = validatePartyMember(fields);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    updateMember(member.id, fields);
    toast.success('Saved');
    onClose();
  };

  const full = (member.todos ?? []).length >= PARTY_LIMITS.todosPerMember;

  return (
    <>
      <BottomSheet
        visible={!confirmRemove}
        onClose={onClose}
        title={`Edit ${member.name}`}
        footer={
          <Stack gap="xs">
            <Button label="Save" onPress={save} />
            <Button
              label="Remove from the wedding party"
              variant="ghost"
              onPress={() => setConfirmRemove(true)}
            />
          </Stack>
        }
      >
        <Stack gap="md">
          <TextField
            label="Name"
            value={name}
            onChangeText={setName}
            error={errors.name}
            autoCapitalize="words"
          />
          <RolePicker value={roleKey} onChange={setRoleKey} />
          <Row gap="sm" align="flex-start">
            <TextField
              label="Outfit"
              value={outfit}
              onChangeText={setOutfit}
              placeholder="Sage satin midi"
              containerStyle={{ flex: 2 }}
            />
            <TextField
              label="Size"
              value={size}
              onChangeText={setSize}
              placeholder="8"
              containerStyle={{ flex: 1 }}
            />
          </Row>
          <TextField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <Stack gap="xs">
            <Text variant="label">Jobs</Text>
            {(member.todos ?? []).map((entry) => (
              <Row key={entry.id} justify="space-between" align="center" gap="sm">
                <Text variant="body" color={entry.done ? 'subtle' : 'default'} style={{ flex: 1 }}>
                  {entry.title}
                </Text>
                <Touchable
                  onPress={() => removeTodo(member.id, entry.id)}
                  accessibilityLabel={`Remove the job ${entry.title}`}
                >
                  <Icon name="close" size="sm" color="muted" />
                </Touchable>
              </Row>
            ))}
            <Row gap="sm" align="flex-end">
              <TextField
                label="Add a job"
                value={todo}
                onChangeText={setTodo}
                placeholder="Pick up the cake"
                containerStyle={{ flex: 1 }}
              />
              <Button
                label="Add job"
                size="md"
                variant="secondary"
                fullWidth={false}
                disabled={!todo.trim() || full}
                onPress={() => {
                  addTodo(member.id, todo);
                  setTodo('');
                }}
              />
            </Row>
          </Stack>
        </Stack>
      </BottomSheet>

      <ConfirmSheet
        visible={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={() => {
          removeMember(member.id);
          toast.info(`${member.name} removed`);
          onClose();
        }}
        title={`Remove ${member.name}?`}
        message="They come off the wedding party with their jobs and outfit. Their place on the guest list is not touched."
        confirmLabel="Remove"
        destructive
        icon="trash"
      />
    </>
  );
}

export default WeddingPartyScreen;
