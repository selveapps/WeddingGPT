import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, Switch } from 'react-native';
import { useRouter } from 'expo-router';

import {
  Button,
  Card,
  ListRow,
  Screen,
  ScreenHeader,
  SectionHeader,
  SegmentedControl,
  Stack,
  Text,
  TextField,
  useToast,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import {
  useAuthStore,
  selectIsSignedIn,
  useRsvpStore,
  selectRsvpLinks,
  useWebsiteStore,
  selectWebsite,
  useWeddingStore,
  selectWedding,
  useEventStore,
  selectEvents,
} from '@/store';
import { WEBSITE_LIMITS, WebsiteSection, mergeWebsiteSchedule, websiteFilledSections } from '@/models';
import { formatMediumDate } from '@/lib/date';
import { Routes } from '@/navigation/routes';
import { isSyncConfigured } from '@/services/sync';
import { rsvpApi } from '@/services/rsvp';
import { useActiveWorkspace } from '@/features/sync/useActiveWorkspace';
import { syncErrorMessage } from '@/features/sync/syncStatus';
import { publicBase } from '@/features/rsvp/rsvpModel';

import { WebsiteItemSheet } from './WebsiteItemSheet';

const VISIBILITY_OPTIONS = [
  { value: 'off', label: 'Off' },
  { value: 'public', label: 'Public' },
  { value: 'password', label: 'Password' },
];

const LISTS = [
  {
    section: WebsiteSection.EVENTS,
    title: 'Schedule',
    add: 'Add to the schedule',
    describe: (item) => ({
      title: item.name || item.place,
      subtitle: [item.date ? formatMediumDate(item.date) : null, item.time, item.place]
        .filter(Boolean)
        .join(' · '),
    }),
  },
  {
    section: WebsiteSection.STAYS,
    title: 'Places to stay',
    add: 'Add a place to stay',
    describe: (item) => ({ title: item.name, subtitle: item.notes || item.url }),
  },
  {
    section: WebsiteSection.REGISTRY,
    title: 'Registry',
    add: 'Add a registry link',
    describe: (item) => ({ title: item.name, subtitle: item.url }),
  },
  {
    section: WebsiteSection.FAQ,
    title: 'Questions',
    add: 'Add a question',
    describe: (item) => ({ title: item.question, subtitle: item.answer }),
  },
];

/**
 * The wedding website (slice E2): what guests read before they reply. Content
 * is edited here and syncs like the rest of the wedding; publishing it - off,
 * public or behind a password - is set on the server, so it needs the wedding
 * to be synced. It lives at the RSVP page address.
 */
export function WebsiteScreen() {
  const toast = useToast();
  const { spacing } = useTheme();
  const wedding = useWeddingStore(selectWedding);
  const website = useWebsiteStore(selectWebsite);
  const events = useEventStore(selectEvents);
  const { ensure, update, addItem, updateItem, removeItem } = useWebsiteStore.getState();
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    if (wedding?.id) ensure(wedding.id);
  }, [ensure, wedding?.id]);

  if (!website) return null;

  const filled = websiteFilledSections(website);

  const saveItem = (fields) => {
    const { section, item } = editing;
    if (item?.id) updateItem(section, item.id, fields);
    else if (!addItem(section, fields)) toast.error('That section is full.');
    setEditing(null);
  };

  // Events stay the source: using them again refreshes their items and keeps hand-written ones.
  const fillFromEvents = () => {
    const schedule = mergeWebsiteSchedule(website.events ?? [], events, WEBSITE_LIMITS.itemsPerSection);
    update({ events: schedule });
    toast.success(`Schedule filled from ${events.length} ${events.length === 1 ? 'event' : 'events'}`);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen bottomInset={spacing.xxl}>
        <Stack gap="xl">
          <ScreenHeader eyebrow="Guests" title="Wedding website" />

          <PublishCard filled={filled} />

          <Stack gap="sm">
            <SectionHeader title="Welcome" subtitle="The first thing guests read." />
            <Card>
              <Stack gap="md">
                <TextField
                  label="Headline"
                  value={website.welcome?.title ?? ''}
                  onChangeText={(title) => update({ welcome: { ...website.welcome, title } })}
                  placeholder="We're getting married!"
                />
                <TextField
                  label="Message"
                  value={website.welcome?.body ?? ''}
                  onChangeText={(body) => update({ welcome: { ...website.welcome, body } })}
                  multiline
                  numberOfLines={5}
                  placeholder="A few words to your guests"
                />
              </Stack>
            </Card>
          </Stack>

          {LISTS.map((list) => (
            <Stack gap="sm" key={list.section}>
              <SectionHeader title={list.title} />
              {list.section === WebsiteSection.STAYS ? (
                <TextField
                  label="Getting there"
                  value={website.travel ?? ''}
                  onChangeText={(travel) => update({ travel })}
                  multiline
                  numberOfLines={3}
                  placeholder="Nearest airport, trains, parking"
                />
              ) : null}
              {list.section === WebsiteSection.EVENTS && events.length ? (
                <Button label="Use my events" variant="secondary" iconLeft="calendar" onPress={fillFromEvents} />
              ) : null}
              {(website[list.section] ?? []).length ? (
                <Card padding="none">
                  {website[list.section].map((item) => {
                    const { title, subtitle } = list.describe(item);
                    return (
                      <ListRow
                        key={item.id}
                        title={title || 'Untitled'}
                        subtitle={subtitle || undefined}
                        onPress={() => setEditing({ section: list.section, item })}
                      />
                    );
                  })}
                </Card>
              ) : null}
              <Button
                label={list.add}
                variant="secondary"
                iconLeft="plus"
                onPress={() => setEditing({ section: list.section, item: null })}
              />
            </Stack>
          ))}
        </Stack>

        <WebsiteItemSheet
          key={editing ? `${editing.section}:${editing.item?.id ?? 'new'}` : 'closed'}
          section={editing?.section}
          item={editing?.item}
          visible={Boolean(editing)}
          onClose={() => setEditing(null)}
          onSave={saveItem}
          onDelete={() => {
            removeItem(editing.section, editing.item.id);
            setEditing(null);
          }}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}

/** Publishing: who can see the site, its password, search engines, and a link to it. */
function PublishCard({ filled }) {
  const router = useRouter();
  const toast = useToast();
  const { colors } = useTheme();
  const signedIn = useAuthStore(selectIsSignedIn);
  const linked = useActiveWorkspace() !== 'local';
  const links = useRsvpStore(selectRsvpLinks);
  const ready = isSyncConfigured && signedIn && linked;

  const [remote, setRemote] = useState({ status: 'loading', site: null, slug: null });
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ready) return undefined;
    let cancelled = false;
    Promise.all([rsvpApi.getSiteSettings(), rsvpApi.getSettings()]).then(
      ([site, rsvp]) => {
        if (!cancelled) setRemote({ status: 'ready', site, slug: rsvp?.slug ?? null });
      },
      () => {
        if (!cancelled) setRemote({ status: 'error', site: null, slug: null });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [ready]);

  if (!ready) {
    return (
      <Card tone="accent">
        <Stack gap="sm">
          <Text variant="bodyStrong">Write it now, publish when you are ready</Text>
          <Text variant="bodySm" color="muted">
            Publishing needs your wedding backed up and synced. What you write here is saved and will be
            ready.
          </Text>
          {isSyncConfigured ? (
            <Button
              label="Go to Account"
              size="sm"
              fullWidth={false}
              onPress={() => router.push(Routes.account)}
            />
          ) : null}
        </Stack>
      </Card>
    );
  }

  if (remote.status !== 'ready') {
    return (
      <Card>
        <Text variant="bodySm" color="muted">
          {remote.status === 'error' ? 'Could not reach your website settings.' : 'Loading…'}
        </Text>
      </Card>
    );
  }

  if (!remote.slug) {
    return (
      <Card tone="accent">
        <Stack gap="sm">
          <Text variant="bodyStrong">Choose the page address first</Text>
          <Text variant="bodySm" color="muted">
            Your website and RSVP page share one address. Set it up in RSVP website.
          </Text>
          <Button
            label="Set the address"
            size="sm"
            fullWidth={false}
            onPress={() => router.push(Routes.guestRsvp)}
          />
        </Stack>
      </Card>
    );
  }

  const site = remote.site ?? { visibility: 'off', indexable: false, hasPassword: false };
  const base = process.env.EXPO_PUBLIC_SITE_URL || publicBase(links);
  const address = base ? `${base}/w/${remote.slug}` : null;

  const save = async (patch, success) => {
    setBusy(true);
    setError(null);
    try {
      const next = await rsvpApi.saveSiteSettings(patch);
      setRemote((current) => ({ ...current, site: next }));
      if (success) toast.success(success);
      return true;
    } catch (caught) {
      setError(
        caught?.code === 'invalid'
          ? 'Use at least 6 characters for the password.'
          : syncErrorMessage(caught?.code)
      );
      return false;
    } finally {
      setBusy(false);
    }
  };

  const chooseVisibility = (visibility) => {
    if (visibility === 'password' && !site.hasPassword && password.length < 6) {
      setError('Set a password of at least 6 characters first.');
      return;
    }
    save(
      visibility === 'password' && password ? { visibility, password } : { visibility },
      visibility === 'off' ? 'Website hidden' : 'Website published'
    );
  };

  return (
    <Stack gap="sm">
      <SectionHeader
        title="Publishing"
        subtitle={filled.length ? `Has ${filled.join(', ')}` : 'Nothing written yet'}
      />
      <Card>
        <Stack gap="md">
          <SegmentedControl
            options={VISIBILITY_OPTIONS}
            value={site.visibility}
            onChange={chooseVisibility}
          />
          <TextField
            label={site.hasPassword ? 'Change the password' : 'Password for guests'}
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            autoCorrect={false}
            helper="Print it on your invitation. Changing it signs everyone out."
          />
          {password ? (
            <Button
              label="Save password"
              variant="secondary"
              size="sm"
              fullWidth={false}
              loading={busy}
              onPress={async () => {
                if (await save({ password }, 'Password saved')) setPassword('');
              }}
            />
          ) : null}
          {site.visibility === 'public' ? (
            <ListRow
              inset={false}
              title="Show in search engines"
              subtitle="Off keeps it to people with the address"
              showChevron={false}
              trailing={
                <Switch
                  value={site.indexable}
                  onValueChange={(indexable) => save({ indexable })}
                  accessibilityLabel="Show in search engines"
                  trackColor={{ false: colors.borderStrong, true: colors.brand }}
                  thumbColor={colors.surface}
                />
              }
            />
          ) : null}
          {error ? (
            <Text variant="bodySm" color="danger" accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}
          {address && site.visibility !== 'off' ? (
            <Button label="Open the website" variant="ghost" onPress={() => Linking.openURL(address)} />
          ) : null}
          {address ? (
            <Text variant="caption" color="subtle">
              {address}
            </Text>
          ) : null}
        </Stack>
      </Card>
    </Stack>
  );
}

export default WebsiteScreen;
