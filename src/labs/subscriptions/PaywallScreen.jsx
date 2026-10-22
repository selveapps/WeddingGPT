import React, { useState } from 'react';
import { View } from 'react-native';

import {
  Stack,
  Row,
  Text,
  Card,
  Badge,
  Button,
  Icon,
  ListRow,
  SectionHeader,
  ConfirmSheet,
  useToast,
} from '@/design-system/components';
import { EntitlementStatus } from '@/models';
import { formatMoney } from '@/lib/currency';
import { useGuestStore, selectGuestCount } from '@/store';

import { LabScreen } from '../shared/LabScreen';
import { selectMeta } from '../shared/createCollectionStore';
import { useLabSubscriptionStore } from './store';
import {
  FEATURE_TABLE,
  PLANS,
  PremiumFeature,
  canUse,
  effectiveEntitlement,
  isPlus,
  perMonthLabel,
  savingsPercent,
  statusLine,
} from './model';

const GATED = [
  { feature: PremiumFeature.PARTNER_SYNC, label: 'Partner sync' },
  { feature: PremiumFeature.CLAUDE_ASSISTANT, label: 'Claude assistant' },
  { feature: PremiumFeature.SEATING_CHART, label: 'Seating chart' },
  { feature: PremiumFeature.QUOTE_READER, label: 'Quote reader' },
  { feature: PremiumFeature.UNLIMITED_GUESTS, label: 'Add more guests' },
];

export default function PaywallScreen() {
  const toast = useToast();
  const meta = useLabSubscriptionStore(selectMeta);
  const store = useLabSubscriptionStore.getState();
  const guestCount = useGuestStore(selectGuestCount);

  const [planKey, setPlanKey] = useState(PLANS[0].key);
  const [cancelling, setCancelling] = useState(false);

  const entitlement = effectiveEntitlement(meta.entitlement ?? null);
  const plus = isPlus(entitlement);
  const active = entitlement?.status === EntitlementStatus.ACTIVE;

  const run = (result, success) => {
    if (result?.error) toast.warning(result.error);
    else toast.success(success);
  };

  return (
    <LabScreen
      title="WeddingGPT Plus"
      intro="Paywall prototype in test mode. Nothing is charged; prices are placeholders."
    >
      <Card tone={plus ? 'brand' : 'muted'}>
        <Row justify="space-between">
          <Text variant="bodyStrong">{statusLine(meta.entitlement ?? null)}</Text>
          <Badge label={plus ? 'Plus' : 'Free'} tone={plus ? 'success' : 'neutral'} />
        </Row>
      </Card>

      <Stack gap="sm">
        <SectionHeader title="What you get" />
        <Card padding="none">
          {FEATURE_TABLE.map((row) => (
            <ListRow
              key={row.key}
              title={row.label}
              subtitle={row.free ? `Free: ${row.free}` : 'Plus only'}
              trailing={<Icon name={row.free ? 'check' : 'lock'} size="sm" color={row.free ? 'success' : 'inkSubtle'} />}
              showChevron={false}
            />
          ))}
        </Card>
      </Stack>

      {!active ? (
        <Stack gap="sm">
          <SectionHeader title="Choose a plan" />
          {PLANS.map((plan) => {
            const selected = plan.key === planKey;
            const saving = savingsPercent(plan.key);
            return (
              <Card
                key={plan.key}
                tone={selected ? 'brand' : 'plain'}
                onPress={() => setPlanKey(plan.key)}
                accessibilityRole="radio"
                accessibilityLabel={`${plan.label}, ${formatMoney(plan.price, undefined, { showDecimals: true })}`}
              >
                <Row justify="space-between">
                  <Stack gap="hair">
                    <Row gap="xs">
                      <Text variant="bodyStrong">{plan.label}</Text>
                      {saving ? <Badge label={`Save ${saving}%`} tone="accent" /> : null}
                    </Row>
                    <Text variant="caption" color="muted">
                      {plan.months > 1 ? perMonthLabel(plan.key) : 'Cancel any time'}
                    </Text>
                  </Stack>
                  <View>
                    <Text variant="bodyStrong">{formatMoney(plan.price, undefined, { showDecimals: true })}</Text>
                  </View>
                </Row>
              </Card>
            );
          })}
          <Button
            label="Subscribe (test)"
            onPress={() => run(store.purchase(planKey), 'Welcome to Plus (test purchase)')}
          />
          {!meta.trialUsed ? (
            <Button
              label="Start 7-day free trial"
              variant="secondary"
              onPress={() => run(store.startTrial(), 'Trial started')}
            />
          ) : null}
        </Stack>
      ) : (
        <Stack gap="sm">
          {entitlement.willRenew ? (
            <Button label="Cancel renewal" variant="secondary" onPress={() => setCancelling(true)} />
          ) : (
            <Text variant="bodySm" color="muted">
              Renewal is off. Plus stays on until the date above.
            </Text>
          )}
        </Stack>
      )}

      <Stack gap="sm">
        <SectionHeader title="Gate check" subtitle="What the app would allow right now." />
        <Card padding="none">
          {GATED.map((entry) => {
            const allowed = canUse(entry.feature, meta.entitlement ?? null, { guestCount });
            return (
              <ListRow
                key={entry.feature}
                title={entry.label}
                trailing={<Badge label={allowed ? 'Unlocked' : 'Locked'} tone={allowed ? 'success' : 'neutral'} />}
                showChevron={false}
              />
            );
          })}
        </Card>
        <Button label="Reset test purchases" variant="ghost" onPress={() => store.reset()} />
      </Stack>

      <ConfirmSheet
        visible={cancelling}
        onClose={() => setCancelling(false)}
        onConfirm={() => {
          store.cancelRenewal();
          setCancelling(false);
        }}
        title="Turn off renewal?"
        message="You keep Plus until the end of the period you paid for."
        confirmLabel="Turn off renewal"
        destructive
      />
    </LabScreen>
  );
}
