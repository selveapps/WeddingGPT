import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Share, Switch } from 'react-native';
import { useRouter } from 'expo-router';

import {
  Badge,
  Button,
  Card,
  ListRow,
  Screen,
  ScreenHeader,
  SectionHeader,
  Stack,
  Text,
  TextField,
  useToast,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import {
  useAuthStore,
  selectIsSignedIn,
  useGuestStore,
  selectAllGuests,
  selectAllHouseholds,
  useRsvpStore,
  selectRsvpLinks,
  selectRsvpResponses,
  useWeddingStore,
  selectWedding,
} from '@/store';
import { Routes } from '@/navigation/routes';
import { isSyncConfigured, SyncErrorCode } from '@/services/sync';
import { rsvpApi } from '@/services/rsvp';
import { datedFilename, exportTextFile } from '@/services/files';
import { DateField } from '@/features/shared/DateField';
import { useActiveWorkspace } from '@/features/sync/useActiveWorkspace';
import { syncErrorMessage } from '@/features/sync/syncStatus';

import {
  SLUG_PATTERN,
  buildInvitees,
  codesCsv,
  inviteeStatus,
  publicBase,
  replySummary,
  suggestSlug,
  summariseInvitees,
} from './rsvpModel';

const QUESTIONS = [
  { key: 'meals', label: 'Meal choice' },
  { key: 'dietary', label: 'Allergies and dietary needs' },
  { key: 'plusOnes', label: 'Plus-one names', subtitle: 'For guests you allowed a plus one' },
  { key: 'message', label: 'A note to the two of you' },
  { key: 'events', label: 'Each event separately', subtitle: 'For guests invited to more than one event' },
];

const STATUS_BADGE = {
  none: { label: 'No link yet', tone: 'neutral' },
  sent: { label: 'Link made', tone: 'info' },
  opened: { label: 'Opened', tone: 'brand' },
  replied: { label: 'Replied', tone: 'success' },
};

/**
 * The RSVP website, from the couple's side (slice E1b): the page settings,
 * a link and code for every household, and the replies as they come in.
 * Replies update the guest list by themselves when the app syncs.
 */
export function RsvpScreen() {
  const signedIn = useAuthStore(selectIsSignedIn);
  const linked = useActiveWorkspace() !== 'local';
  const ready = isSyncConfigured && signedIn && linked;
  return ready ? <RsvpManager /> : <NeedsSync />;
}

function NeedsSync() {
  const router = useRouter();
  const { spacing } = useTheme();
  return (
    <Screen bottomInset={spacing.xxl}>
      <Stack gap="lg">
        <ScreenHeader eyebrow="Guests" title="RSVP website" />
        <Card tone="accent">
          <Stack gap="sm">
            <Text variant="bodyStrong">Let guests reply online</Text>
            <Text variant="bodySm" color="muted">
              Each household gets a link and a code. Their answers - attending, meals, dietary needs - land in
              your guest list by themselves. The website runs on your shared wedding, so back it up and sync
              it in Account first.
            </Text>
            {isSyncConfigured ? (
              <Button label="Go to Account" onPress={() => router.push(Routes.account)} />
            ) : (
              <Text variant="caption" color="subtle">
                Accounts are not switched on in this build yet.
              </Text>
            )}
          </Stack>
        </Card>
      </Stack>
    </Screen>
  );
}

function RsvpManager() {
  const toast = useToast();
  const { colors, spacing } = useTheme();
  const wedding = useWeddingStore(selectWedding);
  const guests = useGuestStore(selectAllGuests);
  const households = useGuestStore(selectAllHouseholds);
  const links = useRsvpStore(selectRsvpLinks);
  const responses = useRsvpStore(selectRsvpResponses);
  const saveLinks = useRsvpStore((state) => state.saveLinks);

  const [remote, setRemote] = useState({ status: 'loading', settings: null, invites: [] });
  const [attempt, setAttempt] = useState(0);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([rsvpApi.getSettings(), rsvpApi.listInvites()]).then(
      ([settings, invites]) => {
        if (cancelled) return;
        setRemote({ status: 'ready', settings, invites });
        setForm(
          (current) =>
            current ?? {
              slug: settings?.slug ?? suggestSlug(wedding),
              deadline: settings?.deadline ?? null,
              questions: settings?.questions ?? {
                meals: true,
                dietary: true,
                plusOnes: true,
                message: true,
                events: true,
              },
            }
        );
      },
      () => {
        if (!cancelled) setRemote((current) => ({ ...current, status: 'error' }));
      }
    );
    return () => {
      cancelled = true;
    };
  }, [attempt, wedding]);

  const reload = () => setAttempt((n) => n + 1);

  const invitees = useMemo(() => buildInvitees(guests, households), [guests, households]);
  const statusFor = (invitee) => inviteeStatus(invitee, { invites: remote.invites, links, responses });
  const counts = summariseInvitees(invitees, statusFor);
  const base = publicBase(links);
  const guestsById = useMemo(() => new Map(guests.map((guest) => [guest.id, guest])), [guests]);
  const sortedReplies = useMemo(
    () => [...responses].sort((a, b) => (b.submittedAt ?? '').localeCompare(a.submittedAt ?? '')),
    [responses]
  );

  const slugValid = SLUG_PATTERN.test(form?.slug ?? '');

  const saveSettings = async () => {
    setBusy('settings');
    setError(null);
    try {
      const settings = await rsvpApi.saveSettings(form);
      setRemote((current) => ({ ...current, settings }));
      toast.success('RSVP settings saved');
    } catch (caught) {
      setError(
        caught?.code === SyncErrorCode.SLUG_TAKEN
          ? 'Another wedding already uses that page address. Try a different one.'
          : syncErrorMessage(caught?.code)
      );
    } finally {
      setBusy(null);
    }
  };

  const createLinks = async (targets) => {
    setBusy('links');
    try {
      const created = await rsvpApi.createInvites(targets.map(({ type, id }) => ({ type, id })));
      saveLinks(created);
      toast.success(`${created.length} ${created.length === 1 ? 'link' : 'links'} ready to send`);
      reload();
    } catch (caught) {
      toast.error(syncErrorMessage(caught?.code));
    } finally {
      setBusy(null);
    }
  };

  const shareLink = async (invitee, link) => {
    const page =
      base && remote.settings?.slug
        ? ` or enter code ${link.code} at ${base}/w/${remote.settings.slug}/rsvp`
        : '';
    try {
      await Share.share({
        message: `${invitee.name}, please let us know if you can come: ${link.url}${page}`,
      });
    } catch {
      toast.error('Sharing is not available here');
    }
  };

  const exportCodes = async () => {
    const result = await exportTextFile({
      filename: datedFilename('rsvp-codes'),
      text: codesCsv(invitees, statusFor, { base, slug: remote.settings?.slug }),
      title: 'RSVP codes',
    });
    if (result === 'downloaded') toast.success('Codes downloaded');
    else if (result === 'failed') toast.error('Could not export the codes');
  };

  const switchColors = {
    trackColor: { false: colors.borderStrong, true: colors.brand },
    thumbColor: colors.surface,
    ios_backgroundColor: colors.borderStrong,
  };

  const withoutLink = invitees.filter((invitee) => statusFor(invitee).status === 'none');
  const withLocalLink = invitees.filter((invitee) => statusFor(invitee).link);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen bottomInset={spacing.xxl}>
        <Stack gap="xl">
          <ScreenHeader eyebrow="Guests" title="RSVP website" />

          {remote.status === 'loading' ? (
            <Text variant="bodySm" color="muted">
              Loading your RSVP website…
            </Text>
          ) : null}
          {remote.status === 'error' ? (
            <Card>
              <Stack gap="sm">
                <Text variant="bodySm" color="muted">
                  Could not reach your RSVP website. Check your connection.
                </Text>
                <Button label="Try again" variant="secondary" size="sm" fullWidth={false} onPress={reload} />
              </Stack>
            </Card>
          ) : null}

          {remote.status === 'ready' && form ? (
            <>
              {/* --- Settings ------------------------------------------------- */}
              <Stack gap="sm">
                <SectionHeader
                  title="The page"
                  subtitle="Guests see your names, date and place, then their own invitation."
                />
                <Card>
                  <Stack gap="md">
                    <TextField
                      label="Page address"
                      value={form.slug}
                      onChangeText={(slug) => setForm({ ...form, slug: slug.toLowerCase() })}
                      autoCapitalize="none"
                      autoCorrect={false}
                      error={
                        form.slug && !slugValid
                          ? 'Use 3-40 lowercase letters, numbers and hyphens.'
                          : undefined
                      }
                      helper={
                        base && slugValid
                          ? `Guests with a paper invitation go to ${base}/w/${form.slug}/rsvp`
                          : 'Guests with a paper invitation type their code on this page.'
                      }
                    />
                    <DateField
                      label="Reply by"
                      value={form.deadline}
                      onChange={(deadline) => setForm({ ...form, deadline })}
                      placeholder="No deadline"
                    />
                  </Stack>
                </Card>
                <Card padding="none">
                  {QUESTIONS.map((question) => (
                    <ListRow
                      key={question.key}
                      title={question.label}
                      subtitle={question.subtitle}
                      showChevron={false}
                      trailing={
                        <Switch
                          value={form.questions[question.key] !== false}
                          onValueChange={(on) =>
                            setForm({ ...form, questions: { ...form.questions, [question.key]: on } })
                          }
                          accessibilityLabel={`Ask: ${question.label}`}
                          {...switchColors}
                        />
                      }
                    />
                  ))}
                </Card>
                {error ? (
                  <Text variant="bodySm" color="danger" accessibilityLiveRegion="polite">
                    {error}
                  </Text>
                ) : null}
                <Button
                  label="Save the page"
                  variant="secondary"
                  loading={busy === 'settings'}
                  disabled={!slugValid}
                  onPress={saveSettings}
                />
              </Stack>

              {/* --- Invitations --------------------------------------------- */}
              <Stack gap="sm">
                <SectionHeader
                  title="Invitations"
                  subtitle={`${counts.total} to invite · ${counts.total - counts.none} with links · ${counts.opened} opened · ${counts.replied} replied`}
                />
                {withoutLink.length ? (
                  <Button
                    label={`Create links for ${withoutLink.length} ${withoutLink.length === 1 ? 'invitation' : 'invitations'}`}
                    iconLeft="send"
                    loading={busy === 'links'}
                    onPress={() => createLinks(withoutLink)}
                  />
                ) : null}
                {withLocalLink.length ? (
                  <Button
                    label="Export codes for printing"
                    variant="ghost"
                    iconLeft="note"
                    onPress={exportCodes}
                  />
                ) : null}
                <Card padding="none">
                  {invitees.map((invitee) => {
                    const { status, link } = statusFor(invitee);
                    const badge = STATUS_BADGE[status];
                    return (
                      <ListRow
                        key={`${invitee.type}:${invitee.id}`}
                        title={invitee.name}
                        subtitle={
                          link
                            ? `Code ${link.code} · tap to send`
                            : status === 'none'
                              ? `${invitee.guestIds.length} ${invitee.guestIds.length === 1 ? 'guest' : 'guests'}`
                              : 'Link made on another phone - tap for a new one'
                        }
                        trailing={<Badge label={badge.label} tone={badge.tone} />}
                        showChevron={false}
                        onPress={link ? () => shareLink(invitee, link) : () => createLinks([invitee])}
                      />
                    );
                  })}
                </Card>
                {!invitees.length ? (
                  <Text variant="bodySm" color="muted">
                    Add guests first - each household gets its own link.
                  </Text>
                ) : null}
              </Stack>

              {/* --- Replies ------------------------------------------------- */}
              <Stack gap="sm">
                <SectionHeader title="Replies" subtitle="They update your guest list by themselves." />
                {sortedReplies.length ? (
                  <Card padding="none">
                    {sortedReplies.map((response) => {
                      const invitee = invitees.find(
                        (item) => item.type === response.targetType && item.id === response.targetId
                      );
                      const names = (response.guests ?? [])
                        .map((answer) => guestsById.get(answer.guestId)?.firstName)
                        .filter(Boolean)
                        .join(', ');
                      return (
                        <ListRow
                          key={response.id}
                          title={invitee?.name || names || 'A guest'}
                          subtitle={[
                            replySummary(response),
                            response.message ? `"${response.message}"` : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                          subtitleLines={3}
                          showChevron={false}
                        />
                      );
                    })}
                  </Card>
                ) : (
                  <Text variant="bodySm" color="muted">
                    No replies yet. They appear here, and in your guest list, as guests answer.
                  </Text>
                )}
              </Stack>
            </>
          ) : null}
        </Stack>
      </Screen>
    </KeyboardAvoidingView>
  );
}

export default RsvpScreen;
