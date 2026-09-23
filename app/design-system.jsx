import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { useTheme } from '@/design-system/theme';
import {
  Screen,
  Stack,
  Row,
  Text,
  Icon,
  iconNames,
  Button,
  Card,
  Chip,
  Badge,
  Avatar,
  Checkbox,
  Divider,
  ListRow,
  SectionHeader,
  TextField,
  SegmentedControl,
  ProgressBar,
  ProgressRing,
  AnimatedNumber,
  SkeletonRow,
  EmptyState,
  ErrorState,
  BottomSheet,
  ConfirmSheet,
  useToast,
} from '@/design-system/components';
import { formatMoney } from '@/lib/currency';
import { rules, validate } from '@/lib/validation';

/**
 * Design-system gallery.
 *
 * A living reference for the component library rather than a product screen -
 * it is how a change to a token gets eyeballed across every component at once,
 * on a real device, before it ships. Reachable at /design-system.
 */
export default function DesignSystemGallery() {
  const theme = useTheme();
  const toast = useToast();
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState('all');
  const [tags, setTags] = useState(['Garden']);
  const [done, setDone] = useState({ venue: true, caterer: false });
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(null);
  const [spent, setSpent] = useState(28500000);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const budgetTotal = 120000000;

  const toggleTag = (tag) =>
    setTags((current) =>
      current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]
    );

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      toast.success('Wedding details saved');
      setTimeout(() => setSaved(false), 1600);
    }, 800);
  };

  return (
    <Screen>
      <Stack gap="xxl">
        <Stack gap="xxs">
          <Text variant="eyebrow" color="accent">
            Phase 1 - Foundation
          </Text>
          <Text variant="displaySm" heading>
            Design system
          </Text>
          <Text variant="body" color="muted">
            {theme.scheme} mode{theme.reduceMotion ? ' - reduced motion' : ''} -{' '}
            {iconNames.length} icons
          </Text>
          <Button
            label="Back to app"
            variant="ghost"
            fullWidth={false}
            iconLeft="arrowLeft"
            onPress={() => router.back()}
          />
        </Stack>

        {/* --- Typography -------------------------------------------------- */}
        <Stack gap="xs">
          <SectionHeader eyebrow="Tokens" title="Typography" />
          <Text variant="displayMd">128 days</Text>
          <Text variant="h1">A calm place to plan</Text>
          <Text variant="h3" color="muted">
            Supporting heading
          </Text>
          <Text variant="body">
            Body copy sets the tone: warm, plain-spoken, never administrative.
          </Text>
          <Text variant="caption" color="subtle">
            Caption and helper text
          </Text>
        </Stack>

        {/* --- Buttons ----------------------------------------------------- */}
        <Stack gap="sm">
          <SectionHeader eyebrow="Controls" title="Buttons" />
          <Button label="Continue" iconRight="arrowRight" onPress={() => toast.info('Primary')} />
          <Button label="Secondary" variant="secondary" onPress={() => {}} />
          <Button label="Ask WeddingGPT" variant="soft" iconLeft="sparkle" onPress={() => {}} />
          <Button label="Ghost action" variant="ghost" onPress={() => {}} />
          <Button
            label={saved ? 'Saved' : 'Save changes'}
            loading={saving}
            success={saved}
            onPress={handleSave}
          />
          <Button label="Unavailable" disabled onPress={() => {}} />
          <Row gap="xs">
            <Button label="Small" size="sm" variant="secondary" fullWidth={false} onPress={() => {}} />
            <Button
              label="Delete"
              size="sm"
              variant="danger"
              iconLeft="trash"
              fullWidth={false}
              onPress={() => setConfirmOpen(true)}
            />
          </Row>
        </Stack>

        {/* --- Selection --------------------------------------------------- */}
        <Stack gap="sm">
          <SectionHeader eyebrow="Controls" title="Selection" />
          <SegmentedControl
            options={[
              { value: 'all', label: 'All' },
              { value: 'todo', label: 'To do' },
              { value: 'done', label: 'Done' },
            ]}
            value={tab}
            onChange={setTab}
          />
          <Row gap="xs" wrap>
            {['Garden', 'Coastal', 'Traditional', 'Modern', 'Intimate'].map((tag) => (
              <Chip
                key={tag}
                label={tag}
                selected={tags.includes(tag)}
                onPress={() => toggleTag(tag)}
              />
            ))}
          </Row>
          <Row gap="xs" wrap>
            <Badge label="Attending" tone="success" dot />
            <Badge label="Awaiting reply" tone="warning" dot />
            <Badge label="Declined" tone="danger" dot />
            <Badge label="Booked" tone="brand" icon="check" />
          </Row>
        </Stack>

        {/* --- Text fields ------------------------------------------------- */}
        <Stack gap="sm">
          <SectionHeader eyebrow="Controls" title="Text fields" />
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            onBlur={() => setEmailError(validate(email, [rules.required('Email'), rules.email()]))}
            error={emailError}
            helper="We only use this to sync your workspace."
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            required
          />
          <TextField
            label="Total budget"
            prefix="Rs"
            placeholder="12,00,000"
            keyboardType="number-pad"
            helper="You can refine this later."
          />
          <TextField label="Notes" multiline placeholder="Anything worth remembering..." />
        </Stack>

        {/* --- Progress ---------------------------------------------------- */}
        <Stack gap="sm">
          <SectionHeader eyebrow="Feedback" title="Progress" />
          <Card tone="raised">
            <Row gap="md">
              <ProgressRing value={0.42} size={88}>
                <Text variant="h2">42%</Text>
              </ProgressRing>
              <Stack gap="xs" style={{ flex: 1 }}>
                <Text variant="h4">Planning progress</Text>
                <Text variant="bodySm" color="muted">
                  17 of 40 tasks complete
                </Text>
                <ProgressBar value={0.42} />
              </Stack>
            </Row>
          </Card>

          <Card>
            <Stack gap="sm">
              <Row justify="space-between">
                <Text variant="label" color="muted">
                  Spent so far
                </Text>
                <Text variant="caption" color="subtle">
                  of {formatMoney(budgetTotal)}
                </Text>
              </Row>
              <AnimatedNumber value={spent} variant="numericLg" format={(n) => formatMoney(n)} />
              <ProgressBar
                segments={[
                  { key: 'spent', value: spent / budgetTotal, color: 'brand' },
                  { key: 'committed', value: 0.18, color: 'accent' },
                ]}
              />
              <Row gap="xs">
                <Button
                  label="Add expense"
                  size="sm"
                  variant="secondary"
                  fullWidth={false}
                  onPress={() => setSpent((v) => v + 4500000)}
                />
                <Button
                  label="Refund"
                  size="sm"
                  variant="ghost"
                  fullWidth={false}
                  onPress={() => setSpent((v) => Math.max(0, v - 3000000))}
                />
              </Row>
            </Stack>
          </Card>
        </Stack>

        {/* --- Rows -------------------------------------------------------- */}
        <Stack gap="xs">
          <SectionHeader
            eyebrow="Content"
            title="List rows"
            actionLabel="See all"
            onActionPress={() => {}}
          />
          <Card padding="sm">
            <ListRow
              leading={
                <Checkbox checked={done.venue} onChange={(v) => setDone((d) => ({ ...d, venue: v }))} />
              }
              title="Confirm venue walkthrough"
              subtitle="Due Saturday - Riverside Hall"
              trailing={<Badge label="Venue" tone="brand" />}
            />
            <Divider spacing="xs" />
            <ListRow
              leading={
                <Checkbox
                  checked={done.caterer}
                  onChange={(v) => setDone((d) => ({ ...d, caterer: v }))}
                />
              }
              title="Shortlist three caterers"
              subtitle="Overdue by 2 days"
              trailing={<Badge label="Overdue" tone="danger" />}
            />
            <Divider spacing="xs" />
            <ListRow
              leading={<Avatar name="Priya Sharma" />}
              title="Priya Sharma"
              subtitle="Vegetarian"
              meta="+1"
              onPress={() => toast.info('Guest detail arrives in Phase 3')}
            />
            <Divider spacing="xs" />
            <ListRow
              leading={<Avatar name="Arjun Mehta" />}
              title="Arjun Mehta"
              subtitle="College friends"
              onPress={() => {}}
            />
          </Card>
        </Stack>

        {/* --- Surfaces ---------------------------------------------------- */}
        <Stack gap="sm">
          <SectionHeader eyebrow="Surfaces" title="Cards and sheets" />
          <Card tone="brand" onPress={() => setSheetOpen(true)} accessibilityLabel="Next best action">
            <Row gap="sm">
              <Icon name="sparkle" size="xl" color={theme.colors.brandSoftInk} />
              <Stack gap="hair" style={{ flex: 1 }}>
                <Text variant="eyebrow" color={theme.colors.brandSoftInk}>
                  Next best action
                </Text>
                <Text variant="h3">Lock in your venue</Text>
                <Text variant="bodySm" color="muted">
                  Most couples book 9-12 months out. You are at 10.
                </Text>
              </Stack>
              <Icon name="chevronRight" color={theme.colors.brandSoftInk} />
            </Row>
          </Card>
          <Card tone="outline">
            <Text variant="bodySm" color="subtle" align="center">
              Outline card - used behind empty states
            </Text>
          </Card>
        </Stack>

        {/* --- States ------------------------------------------------------ */}
        <Stack gap="sm">
          <SectionHeader eyebrow="States" title="Loading, empty, error" />
          <Card padding="sm">
            <SkeletonRow />
            <SkeletonRow />
          </Card>
          <Card tone="muted" padding="none">
            <EmptyState
              icon="guests"
              title="No guests yet"
              message="Add your first household and we will track RSVPs from there."
              actionLabel="Add a guest"
              onAction={() => toast.success('Guest flow arrives in Phase 3')}
              compact
            />
          </Card>
          <Card tone="muted" padding="none">
            <ErrorState onRetry={() => toast.warning('Retrying...')} compact />
          </Card>
        </Stack>

        {/* --- Icons ------------------------------------------------------- */}
        <Stack gap="sm">
          <SectionHeader eyebrow="Assets" title="Icons" subtitle="Drawn in-house on a 24pt grid" />
          <Row gap="md" wrap>
            {iconNames.map((name) => (
              <View key={name} style={{ alignItems: 'center', width: 62, gap: 4 }}>
                <Icon name={name} color="brand" />
                <Text variant="caption" color="subtle" numberOfLines={1}>
                  {name}
                </Text>
              </View>
            ))}
          </Row>
        </Stack>

        {/* --- Palette ----------------------------------------------------- */}
        <Stack gap="sm">
          <SectionHeader eyebrow="Tokens" title="Palette" />
          <Row gap="xs" wrap>
            {[
              'brand',
              'accent',
              'success',
              'warning',
              'danger',
              'surface',
              'surfaceMuted',
              'surfaceSunken',
            ].map((role) => (
              <Stack key={role} gap="xxs" align="center">
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: theme.radii.md,
                    backgroundColor: theme.colors[role],
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                  }}
                />
                <Text variant="caption" color="subtle">
                  {role}
                </Text>
              </Stack>
            ))}
          </Row>
        </Stack>

        <View style={{ height: theme.spacing.xxl }} />
      </Stack>

      {/* --- Overlays ------------------------------------------------------ */}
      <BottomSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Lock in your venue"
        subtitle="Suggested because you are 10 months out"
        footer={
          <Button
            label="Mark as done"
            iconLeft="check"
            onPress={() => {
              setSheetOpen(false);
              toast.success('Nice - one less thing to carry');
            }}
          />
        }
      >
        <Stack gap="sm">
          <Text variant="body" color="muted">
            Booking the venue first fixes your date, your guest ceiling and roughly half
            your budget. Everything downstream gets easier once it is settled.
          </Text>
          <Row gap="xs" wrap>
            <Chip label="Venue" />
            <Chip label="High priority" tone="warning" />
            <Chip label="Due in 14 days" tone="accent" />
          </Row>
        </Stack>
      </BottomSheet>

      <ConfirmSheet
        visible={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          toast.error('Deleted');
        }}
        title="Remove this guest?"
        message="They will be taken off your list along with their RSVP and meal preference. This cannot be undone."
        confirmLabel="Remove guest"
        destructive
        icon="trash"
      />
    </Screen>
  );
}
