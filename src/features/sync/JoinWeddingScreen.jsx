import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button, Card, Screen, ScreenHeader, Stack, Text, useToast } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { useAuthStore, selectAuthStatus, AuthStatus } from '@/store/authStore';
import { useWeddingStore, selectWedding } from '@/store/weddingStore';
import { isSyncConfigured, workspaceLink } from '@/services/sync';
import { Routes } from '@/navigation/routes';
import { Mascot } from '@/features/mascot/Mascot';
import { AuthMode } from '@/features/auth/authValidation';

import { inviteErrorMessage } from './syncStatus';

/**
 * Where an invite link lands: `weddinggpt://invite/<token>`.
 *
 * Joining needs an account, so a signed-out partner is sent to sign in or
 * create one and comes straight back here. Joining opens the shared wedding;
 * anything already planned on this phone stays as it is (decision D2).
 */
export function JoinWeddingScreen() {
  const router = useRouter();
  const toast = useToast();
  const { spacing } = useTheme();
  const { token } = useLocalSearchParams();
  const status = useAuthStore(selectAuthStatus);
  const ownWedding = useWeddingStore(selectWedding);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);

  const join = async () => {
    setJoining(true);
    setError(null);
    try {
      const workspace = await workspaceLink.joinWithInvite(String(token ?? ''));
      toast.success(`You're in - welcome to ${workspace.name}`);
      router.replace(Routes.home);
    } catch (caught) {
      setError(inviteErrorMessage(caught?.code));
    } finally {
      setJoining(false);
    }
  };

  return (
    <Screen bottomInset={spacing.xxl}>
      <Stack gap="lg">
        <ScreenHeader eyebrow="Invite" title="Plan together" onBack={() => router.replace(Routes.home)} />

        <Stack gap="sm" style={{ alignItems: 'center' }}>
          <Mascot size={96} mood="celebrate" />
          <Text variant="h3" heading style={{ textAlign: 'center' }}>
            You have been invited to plan a wedding
          </Text>
          <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
            Join to share the checklist, budget, guest list and vendors - changes on either phone show up on
            both.
          </Text>
        </Stack>

        {!isSyncConfigured ? (
          <Card tone="sunken">
            <Text variant="bodySm" color="muted">
              Accounts are not switched on in this build yet, so this invite cannot be used here.
            </Text>
          </Card>
        ) : status === AuthStatus.UNKNOWN ? (
          <Text variant="bodySm" color="muted" style={{ textAlign: 'center' }}>
            Checking your account…
          </Text>
        ) : status === AuthStatus.SIGNED_OUT ? (
          <Card>
            <Stack gap="sm">
              <Text variant="bodySm" color="muted">
                Sign in, or create a free account, to join. You will come straight back here.
              </Text>
              <Button
                label="Create an account"
                onPress={() => router.push({ pathname: Routes.signIn, params: { mode: AuthMode.SIGN_UP } })}
              />
              <Button
                label="I already have one"
                variant="secondary"
                onPress={() => router.push(Routes.signIn)}
              />
            </Stack>
          </Card>
        ) : (
          <Stack gap="sm">
            <Button label="Join the wedding" iconLeft="heart" loading={joining} onPress={join} />
            {ownWedding ? (
              <Text variant="caption" color="subtle" style={{ textAlign: 'center' }}>
                What you have already planned on this phone stays as it is. You will see it again if you sign
                out.
              </Text>
            ) : null}
          </Stack>
        )}

        {error ? (
          <Card tone="sunken">
            <Text variant="bodySm" color="danger" accessibilityLiveRegion="polite">
              {error}
            </Text>
          </Card>
        ) : null}
      </Stack>
    </Screen>
  );
}

export default JoinWeddingScreen;
