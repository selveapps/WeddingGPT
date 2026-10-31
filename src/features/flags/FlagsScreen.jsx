import React from 'react';

import {
  Badge,
  Button,
  Card,
  Row,
  SegmentedControl,
  Stack,
  Text,
  useToast,
} from '@/design-system/components';
import { LabScreen } from '@/labs/shared/LabScreen';
import { FLAGS, FLAG_KEYS, resolveFlag, useFlagStore } from '@/services/flags';

const SOURCE_LABEL = { device: 'Set on this phone', build: 'Set by the build', default: 'Default' };

const CHOICES = [
  { value: 'auto', label: 'Build' },
  { value: 'on', label: 'On' },
  { value: 'off', label: 'Off' },
];

/**
 * Feature flags on this phone (K1), for testing: each flag's value and where
 * it comes from, and an override that stays on this phone only. In Labs, so
 * not linked from the app; open `/labs/flags`.
 */
export function FlagsScreen() {
  const toast = useToast();
  const overrides = useFlagStore((state) => state.overrides);
  const { setOverride, clearOverrides } = useFlagStore.getState();
  const overridden = Object.keys(overrides).length;

  return (
    <LabScreen
      title="Feature flags"
      intro="Turn features on or off on this phone to test them. Build follows how this build was made. Nothing here syncs or changes anyone else's app."
      footer={
        overridden ? (
          <Button
            label={`Reset ${overridden} ${overridden === 1 ? 'override' : 'overrides'}`}
            iconLeft="refresh"
            variant="secondary"
            onPress={() => {
              clearOverrides();
              toast.info('Every flag follows the build again');
            }}
          />
        ) : null
      }
    >
      <Stack gap="sm">
        {FLAG_KEYS.map((key) => {
          const { value, source } = resolveFlag(key, { overrides });
          const choice = typeof overrides[key] === 'boolean' ? (overrides[key] ? 'on' : 'off') : 'auto';
          return (
            <Card key={key}>
              <Stack gap="sm">
                <Row gap="xs" align="center" justify="space-between">
                  <Text variant="bodyStrong" style={{ flex: 1 }}>
                    {FLAGS[key].title}
                  </Text>
                  <Badge label={value ? 'On' : 'Off'} tone={value ? 'success' : 'neutral'} />
                </Row>
                <Text variant="bodySm" color="muted">
                  {FLAGS[key].description}
                </Text>
                <Text variant="caption" color="subtle">
                  {`${key} · ${SOURCE_LABEL[source]}`}
                </Text>
                <SegmentedControl
                  size="sm"
                  options={CHOICES}
                  value={choice}
                  onChange={(next) => setOverride(key, next === 'auto' ? null : next === 'on')}
                  testID={`flag-${key}`}
                />
              </Stack>
            </Card>
          );
        })}
      </Stack>
    </LabScreen>
  );
}

export default FlagsScreen;
