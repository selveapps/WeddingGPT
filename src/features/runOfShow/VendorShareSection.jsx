import React, { useEffect, useState } from 'react';

import {
  BottomSheet,
  Button,
  Card,
  Checkbox,
  ListRow,
  Row,
  SectionHeader,
  Stack,
  Text,
  TextField,
  useToast,
} from '@/design-system/components';
import { usePartyStore, useAuthStore, selectPartyMembers, selectIsSignedIn } from '@/store';
import { roleLabel } from '@/models';
import { formatRelativeDay, toISODate } from '@/lib/date';
import { isSyncConfigured } from '@/services/sync';
import { rsvpApi } from '@/services/rsvp';
import { shareText } from '@/services/share';
import { useActiveWorkspace } from '@/features/sync/useActiveWorkspace';

/**
 * Share a day-of sheet with a vendor (slice F3): a read-only link to this
 * event's run of show, where it is, and the people to call. The couple picks
 * who appears; the link can be turned off at any time and stops working a
 * week after the event. It needs the wedding to be synced: the page is
 * served from the account's copy, so it updates as the plan does.
 */
export function VendorShareSection({ eventId = null, dayName }) {
  const toast = useToast();
  const signedIn = useAuthStore(selectIsSignedIn);
  const linked = useActiveWorkspace() !== 'local';
  const ready = isSyncConfigured && signedIn && linked;
  const [sheets, setSheets] = useState([]);
  const [making, setMaking] = useState(false);

  const [version, setVersion] = useState(0);
  const load = () => setVersion((current) => current + 1);

  useEffect(() => {
    if (!ready) return undefined;
    let cancelled = false;
    rsvpApi.listDaySheets().then(
      (list) => {
        if (!cancelled) setSheets(list);
      },
      () => {
        if (!cancelled) setSheets([]);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [ready, version]);

  const mine = sheets.filter((sheet) => (sheet.eventId ?? null) === (eventId ?? null) && !sheet.revokedAt);

  const revoke = async (sheet) => {
    try {
      await rsvpApi.revokeDaySheet(sheet.id);
      toast.info(`${sheet.label}'s link is off`);
      load();
    } catch {
      toast.error('Could not turn the link off. Try again when you are online.');
    }
  };

  return (
    <Stack gap="sm">
      <SectionHeader
        title="Share with a vendor"
        subtitle="A read-only page with this schedule, the place, and who to call."
      />
      {!ready ? (
        <Text variant="bodySm" color="muted">
          Sync your wedding (Account) to share a day-of page with vendors.
        </Text>
      ) : (
        <>
          {mine.length ? (
            <Card padding="none">
              {mine.map((sheet) => (
                <ListRow
                  key={sheet.id}
                  title={sheet.label}
                  subtitle={
                    sheet.lastOpenedAt
                      ? `Opened ${formatRelativeDay(toISODate(new Date(sheet.lastOpenedAt))).toLowerCase()}`
                      : 'Not opened yet'
                  }
                  trailing={
                    <Button
                      label="Turn off"
                      size="sm"
                      variant="ghost"
                      fullWidth={false}
                      accessibilityLabel={`Turn off ${sheet.label}'s link`}
                      onPress={() => revoke(sheet)}
                    />
                  }
                  showChevron={false}
                />
              ))}
            </Card>
          ) : null}
          <Button
            label="Share with a vendor"
            variant="secondary"
            iconLeft="send"
            onPress={() => setMaking(true)}
          />
        </>
      )}
      {making ? (
        <MakeSheet
          eventId={eventId}
          dayName={dayName}
          onClose={() => setMaking(false)}
          onMade={() => {
            setMaking(false);
            load();
          }}
        />
      ) : null}
    </Stack>
  );
}

function MakeSheet({ eventId, dayName, onClose, onMade }) {
  const toast = useToast();
  const members = usePartyStore(selectPartyMembers).filter((member) => member.phone);
  const [label, setLabel] = useState('');
  const [chosen, setChosen] = useState(new Set());
  const [busy, setBusy] = useState(false);

  const toggle = (id) =>
    setChosen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const make = async () => {
    setBusy(true);
    try {
      const { url } = await rsvpApi.createDaySheet({ eventId, label: label.trim(), contactIds: [...chosen] });
      const message = `Here is our day-of plan for ${dayName}: ${url}`;
      if (!(await shareText(message, 'Day-of plan'))) toast.info(`Link ready: ${url}`);
      onMade();
    } catch {
      setBusy(false);
      toast.error('Could not make the link. Try again when you are online.');
    }
  };

  return (
    <BottomSheet
      visible
      onClose={onClose}
      title="Share with a vendor"
      subtitle="They see this schedule, the place and the people you tick - no guests, no costs."
      footer={<Button label="Make the link" loading={busy} disabled={!label.trim()} onPress={make} />}
    >
      <Stack gap="md">
        <TextField
          label="Who is it for?"
          value={label}
          onChangeText={setLabel}
          placeholder="Rosewood Florals"
          maxLength={80}
          autoCapitalize="words"
        />
        <Stack gap="xs">
          <Text variant="label">Who they can call on the day</Text>
          {members.length ? (
            members.map((member) => (
              <Row key={member.id} gap="sm" align="center">
                <Checkbox
                  checked={chosen.has(member.id)}
                  onChange={() => toggle(member.id)}
                  label={`Show ${member.name}`}
                  round={false}
                />
                <Text variant="body" style={{ flex: 1 }}>
                  {`${member.name} (${roleLabel(member.roleKey)})`}
                </Text>
              </Row>
            ))
          ) : (
            <Text variant="bodySm" color="muted">
              Add phone numbers to your wedding party to list a day-of contact.
            </Text>
          )}
        </Stack>
      </Stack>
    </BottomSheet>
  );
}

export default VendorShareSection;
