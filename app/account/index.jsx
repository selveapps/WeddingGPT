import React, { useState } from 'react';
import { useRouter } from 'expo-router';

import {
  Screen,
  Stack,
  Row,
  Text,
  Card,
  Button,
  Avatar,
  ListRow,
  ScreenHeader,
  SectionHeader,
  ConfirmSheet,
  useToast,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { useAuthStore, selectAuthAvailable, selectAuthUser, selectIsSignedIn } from '@/store';
import { Routes } from '@/navigation/routes';
import { AuthMode } from '@/features/auth/authValidation';
import { SyncSection } from '@/features/sync/SyncSection';
import { signOutWarning } from '@/features/sync/syncStatus';
import { isSyncConfigured, workspaceLink } from '@/services/sync';

/**
 * Account: who is signed in, and the settings that belong to the person
 * rather than to one wedding screen.
 *
 * Signing out never touches the phone's own wedding. A synced wedding's copy
 * leaves the phone (decision D6), so signing out asks first when changes have
 * not synced yet.
 */
export default function AccountScreen() {
  const router = useRouter();
  const toast = useToast();
  const { spacing } = useTheme();

  const available = useAuthStore(selectAuthAvailable);
  const signedIn = useAuthStore(selectIsSignedIn);
  const user = useAuthStore(selectAuthUser);
  const signOut = useAuthStore((state) => state.signOut);
  const [confirmSignOut, setConfirmSignOut] = useState(null);

  const finishSignOut = async () => {
    setConfirmSignOut(null);
    const linked = workspaceLink.isLinked();
    // Leave first, while still signed in, so nothing tries to sync mid-way.
    if (linked) await workspaceLink.leave();
    await signOut();
    toast.info(
      linked
        ? "Signed out. The shared wedding is safe in your account; this phone's own plan is back."
        : 'Signed out. Your plan is still on this device.'
    );
  };

  const handleSignOut = () => {
    const warning = signOutWarning(workspaceLink.pendingChanges());
    if (warning) setConfirmSignOut(warning);
    else finishSignOut();
  };

  return (
    <Screen bottomInset={spacing.xxl}>
      <Stack gap="lg">
        <ScreenHeader eyebrow="Settings" title="Account" />

        {signedIn && user ? (
          <Card>
            <Stack gap="md">
              <Row gap="md">
                <Avatar name={user.name || user.email} size="lg" />
                <Stack gap="hair" style={{ flex: 1 }}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {user.name || 'Signed in'}
                  </Text>
                  <Text variant="bodySm" color="muted" numberOfLines={1}>
                    {user.email}
                  </Text>
                </Stack>
              </Row>
              <Button label="Sign out" variant="secondary" iconLeft="user" onPress={handleSignOut} />
            </Stack>
          </Card>
        ) : (
          <Card tone="accent">
            <Stack gap="sm">
              <Text variant="bodyStrong">Sign in to WeddingGPT</Text>
              <Text variant="bodySm" color="muted">
                {available
                  ? 'Optional. Your plan keeps working without an account.'
                  : 'Accounts are not switched on in this build yet. Everything you plan is saved on this device.'}
              </Text>
              {available ? (
                <Row gap="xs">
                  <Button
                    label="Sign in"
                    size="sm"
                    fullWidth={false}
                    onPress={() => router.push(Routes.signIn)}
                  />
                  <Button
                    label="Create account"
                    size="sm"
                    variant="ghost"
                    fullWidth={false}
                    onPress={() =>
                      router.push({ pathname: Routes.signIn, params: { mode: AuthMode.SIGN_UP } })
                    }
                  />
                </Row>
              ) : null}
            </Stack>
          </Card>
        )}

        {signedIn && isSyncConfigured ? <SyncSection /> : null}

        <Stack gap="xs">
          <SectionHeader title="Settings" />
          <Card padding="none">
            <ListRow
              icon="user"
              title="Profile"
              subtitle="Your wedding details, preferences and keepsakes"
              onPress={() => router.push(Routes.profile)}
            />
            <ListRow
              icon="bell"
              title="Reminders"
              subtitle="Daily checklist, deadlines and payments"
              onPress={() => router.push(Routes.notifications)}
            />
          </Card>
        </Stack>
      </Stack>

      <ConfirmSheet
        visible={Boolean(confirmSignOut)}
        onClose={() => setConfirmSignOut(null)}
        onConfirm={finishSignOut}
        title="Sign out anyway?"
        message={confirmSignOut ?? ''}
        confirmLabel="Sign out"
        cancelLabel="Stay signed in"
        destructive
      />
    </Screen>
  );
}
