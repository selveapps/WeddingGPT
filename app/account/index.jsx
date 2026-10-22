import React from 'react';
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
  useToast,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { useAuthStore, selectAuthAvailable, selectAuthUser, selectIsSignedIn } from '@/store';
import { Routes } from '@/navigation/routes';
import { AuthMode } from '@/features/auth/authValidation';

/**
 * Account: who is signed in, and the settings that belong to the person
 * rather than to one wedding screen.
 *
 * Signing out never touches the wedding - it lives on the device, not in the
 * account - so it needs no confirmation, and the copy says so.
 */
export default function AccountScreen() {
  const router = useRouter();
  const toast = useToast();
  const { spacing } = useTheme();

  const available = useAuthStore(selectAuthAvailable);
  const signedIn = useAuthStore(selectIsSignedIn);
  const user = useAuthStore(selectAuthUser);
  const signOut = useAuthStore((state) => state.signOut);

  const handleSignOut = async () => {
    await signOut();
    toast.info('Signed out. Your plan is still on this device.');
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

        <Stack gap="xs">
          <SectionHeader title="Settings" />
          <Card padding="none">
            <ListRow
              icon="bell"
              title="Reminders"
              subtitle="Daily checklist, deadlines and payments"
              onPress={() => router.push(Routes.notifications)}
            />
          </Card>
        </Stack>
      </Stack>
    </Screen>
  );
}
