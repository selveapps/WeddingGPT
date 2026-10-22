import React, { useMemo, useState } from 'react';

import {
  Stack,
  Text,
  Card,
  Badge,
  Button,
  TextField,
  ListRow,
  SectionHeader,
  ConfirmSheet,
  EmptyState,
  useToast,
} from '@/design-system/components';
import {
  useGuestStore,
  useWeddingStore,
  selectAllGuests,
  selectAllHouseholds,
  selectWedding,
} from '@/store';
import { RSVP_STATUS_META, coupleDisplayName, guestFullName } from '@/models';
import { formatLongDate } from '@/lib/date';

import { LabScreen } from '../shared/LabScreen';
import { shareText } from '../shared/share';
import {
  buildInvitees,
  inviteMessage,
  parseRsvpReplies,
  repliesToChanges,
  rsvpLink,
} from './model';

const RSVP_URL = process.env.EXPO_PUBLIC_RSVP_URL ?? '';

export default function RsvpCodesScreen() {
  const toast = useToast();
  const guests = useGuestStore(selectAllGuests);
  const households = useGuestStore(selectAllHouseholds);
  const setRsvp = useGuestStore((state) => state.setRsvp);
  const wedding = useWeddingStore(selectWedding);

  const invitees = useMemo(() => buildInvitees(guests, households), [guests, households]);
  const guestsById = useMemo(() => new Map(guests.map((guest) => [guest.id, guest])), [guests]);

  const [pasted, setPasted] = useState('');
  const [preview, setPreview] = useState(null);
  const [confirming, setConfirming] = useState(false);

  const coupleName = wedding ? coupleDisplayName(wedding) : 'We';
  const dateText = wedding?.date ? formatLongDate(wedding.date) : '';

  const shareInvite = async (invitee) => {
    const message = inviteMessage({ invitee, coupleName, dateText, link: rsvpLink(RSVP_URL, invitee.code) });
    const ok = await shareText(message, 'RSVP');
    if (!ok) toast.error('Sharing is not available here');
  };

  const previewReplies = () => {
    const parsed = parseRsvpReplies(pasted, invitees);
    setPreview({ ...parsed, changes: repliesToChanges(parsed.replies) });
  };

  const apply = () => {
    setConfirming(false);
    for (const change of preview.changes) setRsvp(change.guestId, change.rsvpStatus);
    toast.success(`Updated ${preview.changes.length} RSVP${preview.changes.length === 1 ? '' : 's'}`);
    setPreview(null);
    setPasted('');
  };

  return (
    <LabScreen
      title="RSVP codes"
      intro="Each household gets a short code. Share the invite, then paste replies like “K7Q2MX yes 2” to update RSVPs in one go."
    >
      {invitees.length === 0 ? (
        <EmptyState icon="guests" title="No guests yet" message="Add guests in the Guests tab to get their codes." />
      ) : (
        <>
          <Card>
            <Stack gap="md">
              <Text variant="h3">Record replies</Text>
              <TextField
                label="Paste replies, one per line"
                value={pasted}
                onChangeText={(text) => {
                  setPasted(text);
                  setPreview(null);
                }}
                multiline
                numberOfLines={4}
                autoCapitalize="characters"
                placeholder={`${invitees[0].code} yes 2`}
              />
              <Button label="Preview" variant="secondary" onPress={previewReplies} disabled={!pasted.trim()} />
            </Stack>
          </Card>

          {preview ? (
            <Stack gap="sm">
              <SectionHeader title={`${preview.changes.length} RSVP changes`} />
              {preview.changes.length ? (
                <Card padding="none">
                  {preview.changes.map((change) => {
                    const meta = RSVP_STATUS_META[change.rsvpStatus];
                    return (
                      <ListRow
                        key={change.guestId}
                        title={guestFullName(guestsById.get(change.guestId)) || 'Guest'}
                        trailing={<Badge label={meta.label} tone={meta.tone} />}
                        showChevron={false}
                      />
                    );
                  })}
                </Card>
              ) : null}
              {preview.errors.map((entry) => (
                <Card key={entry.line} tone="muted">
                  <Text variant="bodySm">{entry.line}</Text>
                  <Text variant="caption" color="danger">
                    {entry.reason}
                  </Text>
                </Card>
              ))}
              <Button
                label="Update RSVPs"
                onPress={() => setConfirming(true)}
                disabled={!preview.changes.length}
              />
            </Stack>
          ) : null}

          <Stack gap="sm">
            <SectionHeader
              title="Invitees"
              subtitle={RSVP_URL ? 'Invites include your RSVP link.' : 'Set EXPO_PUBLIC_RSVP_URL to add a link to invites.'}
            />
            <Card padding="none">
              {invitees.map((invitee) => (
                <ListRow
                  key={invitee.key}
                  title={invitee.name}
                  subtitle={`${invitee.guestIds.length} guest${invitee.guestIds.length === 1 ? '' : 's'}`}
                  meta={invitee.code}
                  onPress={() => shareInvite(invitee)}
                  accessibilityHint="Shares this invite"
                />
              ))}
            </Card>
          </Stack>
        </>
      )}

      <ConfirmSheet
        visible={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={apply}
        title="Update your guest list?"
        message={preview ? `${preview.changes.length} guests' RSVPs will change in the Guests tab.` : ''}
        confirmLabel="Update RSVPs"
      />
    </LabScreen>
  );
}
