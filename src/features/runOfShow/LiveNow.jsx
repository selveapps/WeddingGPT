import React, { useEffect, useMemo, useState } from 'react';
import { Linking } from 'react-native';

import { Badge, Button, Card, ProgressBar, Row, Stack, Text, useToast } from '@/design-system/components';
import { useVendorStore, usePartyStore, selectAllVendors, selectPartyMembers } from '@/store';
import { dayContacts, findContact, itemEnd, liveDay, minutesOfDay, phoneUrl } from '@/models';
import { formatDuration, formatTime } from '@/lib/time';

const TICK_MS = 30 * 1000;
const LATE_STEPS = [5, 10, 15];

/** The clock in minutes after midnight, moving on every 30 seconds. */
function useMinuteClock() {
  const [now, setNow] = useState(() => minutesOfDay(new Date()));
  useEffect(() => {
    const timer = setInterval(() => setNow(minutesOfDay(new Date())), TICK_MS);
    return () => clearInterval(timer);
  }, []);
  return now;
}

/**
 * Live mode (slice I1), shown at the top of the run of show on its day:
 * what is on now, what is next and in how long, a "running late" button that
 * moves everything still to come, and one tap to call whoever runs it.
 * `onPush(item, minutes)` is the screen's shift-with-undo.
 */
export function LiveNow({ items, onPush }) {
  const toast = useToast();
  const now = useMinuteClock();
  const vendors = useVendorStore(selectAllVendors);
  const party = usePartyStore(selectPartyMembers);
  const people = useMemo(() => ({ vendors, party }), [vendors, party]);

  const { current, next, startsIn, done, total, finished } = useMemo(() => liveDay(items, now), [items, now]);
  const contacts = useMemo(() => dayContacts(items, people), [items, people]);
  const notStarted = done === 0 && current.length === 0;

  const call = async (contact) => {
    const url = phoneUrl(contact.phone);
    try {
      if (url) await Linking.openURL(url);
      else throw new Error('no number');
    } catch {
      toast.error(`Could not call ${contact.name}`);
    }
  };

  const callButton = (owner) => {
    const contact = findContact(owner, people);
    return contact ? (
      <Button
        size="sm"
        variant="secondary"
        fullWidth={false}
        iconLeft="phone"
        label={`Call ${contact.name}`}
        onPress={() => call(contact)}
      />
    ) : null;
  };

  return (
    <Card tone="brand">
      <Stack gap="md">
        <Row gap="xs" align="center">
          <Badge label="Live" tone="danger" dot />
          <Text variant="caption" color="muted">
            {`Today · ${formatTime(now)} · ${done} of ${total} done`}
          </Text>
        </Row>
        <ProgressBar value={total ? done / total : 0} />

        {finished ? <Text variant="bodyStrong">That was everything on the day. Congratulations!</Text> : null}

        {current.map((item) => (
          <Stack key={item.id} gap="xxs">
            <Text variant="eyebrow">Now</Text>
            <Text variant="displaySm">{item.title}</Text>
            <Text variant="bodySm" color="muted">
              {[`Until ${formatTime(itemEnd(item))}`, item.location, item.owner].filter(Boolean).join(' · ')}
            </Text>
            <Row gap="xs" wrap>
              {callButton(item.owner)}
            </Row>
          </Stack>
        ))}

        {next ? (
          <Stack gap="xxs">
            <Text variant="eyebrow">{notStarted ? 'First up' : 'Next'}</Text>
            <Text variant="bodyStrong">{next.title}</Text>
            <Text variant="bodySm" color="muted">
              {[
                `${formatTime(next.start)}, in ${formatDuration(startsIn) || 'under a minute'}`,
                next.location,
                next.owner,
              ]
                .filter(Boolean)
                .join(' · ')}
            </Text>
            <Row gap="xs" wrap>
              {callButton(next.owner)}
            </Row>
          </Stack>
        ) : null}

        {next && !notStarted ? (
          <Stack gap="xs">
            <Text variant="labelStrong">Running late?</Text>
            <Row gap="xs" wrap>
              {LATE_STEPS.map((minutes) => (
                <Button
                  key={minutes}
                  size="sm"
                  variant="ghost"
                  fullWidth={false}
                  label={`+${minutes}m`}
                  accessibilityLabel={`Move ${next.title} and everything after it ${minutes} minutes later`}
                  onPress={() => onPush(next, minutes)}
                />
              ))}
            </Row>
          </Stack>
        ) : null}

        {contacts.length ? (
          <Stack gap="xs">
            <Text variant="labelStrong">Who to call today</Text>
            {contacts.map((contact) => (
              <Row key={contact.key} gap="sm" align="center" justify="space-between">
                <Stack gap="hair" style={{ flex: 1 }}>
                  <Text variant="body">{contact.name}</Text>
                  <Text variant="caption" color="subtle" numberOfLines={1}>
                    {contact.items.join(', ')}
                  </Text>
                </Stack>
                <Button
                  size="sm"
                  variant="ghost"
                  fullWidth={false}
                  iconLeft="phone"
                  label="Call"
                  accessibilityLabel={`Call ${contact.name}, ${contact.phone}`}
                  onPress={() => call(contact)}
                />
              </Row>
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Card>
  );
}

export default LiveNow;
