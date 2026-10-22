import React from 'react';
import { useRouter } from 'expo-router';

import { Avatar, Icon, Touchable } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { useAuthStore, selectAuthUser, selectIsSignedIn } from '@/store';
import { Routes } from '@/navigation/routes';

/**
 * Sits beside the notification bell on Home and opens the Account screen.
 * Shows the person's initials once they are signed in, a plain person icon
 * before - it never nags, because an account is optional.
 */
export function AccountButton() {
  const router = useRouter();
  const { colors, borderWidths } = useTheme();
  const signedIn = useAuthStore(selectIsSignedIn);
  const user = useAuthStore(selectAuthUser);

  return (
    <Touchable
      onPress={() => router.push(Routes.account)}
      haptic="light"
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={signedIn ? `Account, signed in as ${user?.email ?? ''}` : 'Account and sign in'}
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: borderWidths.hairline,
      }}
    >
      {signedIn && user ? (
        <Avatar name={user.name || user.email} size="md" />
      ) : (
        <Icon name="user" size="md" color="inkMuted" />
      )}
    </Touchable>
  );
}

export default AccountButton;
