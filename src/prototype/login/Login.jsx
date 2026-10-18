import React, { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  Button,
  Checkbox,
  Icon,
  Row,
  Screen,
  Stack,
  Text,
  TextField,
  Touchable,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { rules, validateForm } from '@/lib/validation';

export function Login({ onSignIn, onForgotPassword, onCreateAccount }) {
  const { colors, spacing, radii, borderWidths } = useTheme();
  const passwordRef = useRef(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const themedStyles = StyleSheet.create({
    brandMark: {
      width: 48,
      height: 48,
      borderRadius: radii.lg,
      backgroundColor: colors.brandSoft,
    },
    formCard: {
      padding: spacing.lg,
      borderRadius: radii.lg,
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: borderWidths.hairline,
    },
  });

//  function to validate the form and call onSignIn if valid
  const submit = () => {
    const result = validateForm(
      { email, password },
      {
        email: [rules.required('Your email'), rules.email()],
        password: [rules.required('Your password')],
      }
    );

    setErrors(result.errors);
    if (!result.isValid) return;

    onSignIn?.({ email: email.trim(), password, rememberMe });
  };

  const updateEmail = (value) => {
    setEmail(value);
    if (errors.email) setErrors((current) => ({ ...current, email: undefined }));
  };

  const updatePassword = (value) => {
    setPassword(value);
    if (errors.password) setErrors((current) => ({ ...current, password: undefined }));
  };

  return (
    // Screen component with a content container style that includes padding and gap
    <Screen
      contentContainerStyle={[
        styles.content,
        {
          paddingVertical: spacing.xl,
          gap: spacing.xl,
        },
      ]}
    >
      <Stack gap="xl" style={styles.main}>
        <Row gap="sm">
          <View style={[styles.brandMark, themedStyles.brandMark]}>
            <Icon name="mark" size="lg" color="brand" />
          </View>
          <Stack gap="none">
            <Row gap="none" align="baseline">
              <Text variant="h2" color="ink">Wedding</Text>
              <Text variant="h2" color="brand">GPT</Text>
            </Row>
            <Text variant="caption" color="muted">Your day, thoughtfully planned</Text>
          </Stack>
        </Row>

        <Stack gap="sm">
          <Text variant="eyebrow" color="brand">WELCOME BACK</Text>
          <Text variant="displayMd" color="ink" heading>
            Let’s pick up{'\n'}where you left off.
          </Text>
          <Text variant="body" color="muted">
            Sign in to keep your wedding plans right where you left them.
          </Text>
        </Stack>

        <Stack gap="lg" style={[styles.formCard, themedStyles.formCard]}>
          <Stack gap="md">
            <TextField
              label="Email address"
              value={email}
              onChangeText={updateEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              error={errors.email}
              required
            />
            <TextField
              ref={passwordRef}
              label="Password"
              value={password}
              onChangeText={updatePassword}
              placeholder="Enter your password"
              secureTextEntry={!showPassword}
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={submit}
              error={errors.password}
              icon={showPassword ? 'eyeOff' : 'eye'}
              iconAccessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              onIconPress={() => setShowPassword((visible) => !visible)}
              required
            />
          </Stack>

          <Row justify="space-between" align="center" gap="xs">
            <Row gap="xs">
              <Checkbox
                checked={rememberMe}
                onChange={setRememberMe}
                size={20}
                label="Remember me"
              />
              <Text variant="label" color="muted">Remember me</Text>
            </Row>
            <Touchable
              onPress={onForgotPassword}
              accessibilityLabel="Forgot password"
              hitSlop={8}
              style={styles.link}
            >
              <Text variant="label" color="brand">Forgot password?</Text>
            </Touchable>
          </Row>

          <Button
            label="Sign in"
            onPress={submit}
            size="xl"
            iconRight="arrowRight"
            accessibilityHint="Sign in to your WeddingGPT account"
          />
        </Stack>
      </Stack>

      <Row justify="center" gap="xs" style={styles.createAccount}>
        <Text variant="body" color="muted">New to WeddingGPT?</Text>
        <Touchable
          onPress={onCreateAccount}
          accessibilityLabel="Create an account"
          hitSlop={8}
        >
          <Text variant="action" color="brand">Create an account</Text>
        </Touchable>
      </Row>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  main: {
    width: '100%',
  },
  brandMark: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCard: {
    width: '100%',
  },
  link: {
    alignSelf: 'center',
  },
  createAccount: {
    flexWrap: 'wrap',
  },
});

export default Login;