import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';

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
import { AppIcon } from '@/features/mascot/AppIcon';
import { validateForm, rules } from '@/lib/validation';

const LOGIN_SCHEMA = {
  email: [rules.required('Email'), rules.email()],
  password: [rules.required('Password')],
};

export function Login({ onLogin, onForgotPassword, onCreateAccount }) {
  const { colors, spacing, radii } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const values = { email: email.trim(), password };
    const result = validateForm(values, LOGIN_SCHEMA);
    setErrors(result.errors);
    setMessage('');
    if (!result.isValid) return;

    if (!onLogin) {
      setMessage('Sign-in is not set up yet. Your wedding plans are still saved on this device.');
      return;
    }

    setLoading(true);
    try {
      await onLogin({ ...values, rememberMe });
    } catch (error) {
      setMessage(
        error instanceof Error && error.message
          ? error.message
          : "We couldn't sign you in just now. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const updateEmail = (value) => {
    setEmail(value);
    setErrors((current) => ({ ...current, email: undefined }));
    setMessage('');
  };

  const updatePassword = (value) => {
    setPassword(value);
    setErrors((current) => ({ ...current, password: undefined }));
    setMessage('');
  };

  return (
    <Screen
      testID="login-screen"
      contentContainerStyle={[
        styles.content,
        { paddingVertical: spacing.xl, gap: spacing.xl },
      ]}
    >
      <Stack align="center" gap="md">
        <AppIcon size={76} />
        <Stack align="center" gap="xxs">
          <Text variant="displayAccent" color="ink">
            Wedding<Text variant="displayMd" color="brand">GPT</Text>
          </Text>
          <Text variant="eyebrow" color="muted" align="center">
            YOUR WEDDING, THOUGHTFULLY PLANNED
          </Text>
        </Stack>
      </Stack>

      <Stack gap="lg">
        <Stack gap="xs">
          <Text variant="h1" color="ink" heading>
            Welcome back
          </Text>
          <Text variant="body" color="muted">
            Sign in to pick up right where your plans left off.
          </Text>
        </Stack>

        <Stack gap="md">
          <TextField
            label="Email address"
            value={email}
            onChangeText={updateEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            error={errors.email}
            testID="login-email"
          />

          <TextField
            label="Password"
            value={password}
            onChangeText={updatePassword}
            placeholder="Enter your password"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="done"
            onSubmitEditing={submit}
            error={errors.password}
            icon={showPassword ? 'eyeOff' : 'eye'}
            onIconPress={() => setShowPassword((visible) => !visible)}
            iconAccessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            testID="login-password"
          />
        </Stack>

        <Row justify="space-between" align="center">
          <Row gap="xs" align="center">
            <Checkbox
              checked={rememberMe}
              onChange={setRememberMe}
              size={20}
              label="Remember me"
              testID="login-remember-me"
            />
            <Text variant="label" color="muted">Remember me</Text>
          </Row>
          <Touchable
            onPress={onForgotPassword}
            disabled={!onForgotPassword}
            haptic="light"
            accessibilityLabel="Forgot password"
            testID="login-forgot-password"
          >
            <Text variant="label" color="brand">Forgot password?</Text>
          </Touchable>
        </Row>

        {message ? (
          <View
            style={[
              styles.message,
              {
                backgroundColor: colors.dangerSoft,
                borderRadius: radii.md,
                padding: spacing.sm,
              },
            ]}
          >
            <Row gap="xs" align="flex-start">
              <Icon name="info" size="sm" color="danger" />
              <Text
                variant="caption"
                color="danger"
                accessibilityLiveRegion="polite"
                style={styles.messageText}
              >
                {message}
              </Text>
            </Row>
          </View>
        ) : null}

        <Button
          label="Sign in"
          onPress={submit}
          loading={loading}
          disabled={loading}
          testID="login-submit"
        />
      </Stack>

      <Row justify="center" gap="xxs" align="center">
        <Text variant="body" color="muted">New to WeddingGPT?</Text>
        <Touchable
          onPress={onCreateAccount}
          disabled={!onCreateAccount}
          haptic="light"
          accessibilityLabel="Create an account"
          testID="login-create-account"
        >
          <Text variant="label" color="brand">Create an account</Text>
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
  message: {
    width: '100%',
  },
  messageText: {
    flex: 1,
  },
});

export default Login;