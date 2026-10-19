import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';

import {
  Button,
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
import { rules, validateForm } from '@/lib/validation';

const SIGNUP_SCHEMA = {
  name: [rules.required('Your name'), rules.maxLength(60, 'Your name')],
  email: [rules.required('Email'), rules.email()],
  password: [
    rules.required('Password'),
    rules.minLength(8, 'Your password'),
    rules.maxLength(128, 'Your password'),
  ],
  confirmPassword: [rules.required('Please confirm your password')],
};

export function Signup({ onSignup, onSignIn }) {
  const { colors, spacing, radii } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const values = { name: name.trim(), email: email.trim(), password, confirmPassword };
    const result = validateForm(values, SIGNUP_SCHEMA);
    if (password && confirmPassword && password !== confirmPassword) {
      result.errors.confirmPassword = 'Your passwords do not match.';
    }
    setErrors(result.errors);
    setMessage('');
    if (Object.keys(result.errors).length > 0) return;

    if (!onSignup) {
      setMessage('Account creation is not set up yet. Your wedding plans are still saved on this device.');
      return;
    }

    setLoading(true);
    try {
      await onSignup({ name: values.name, email: values.email, password });
    } catch (error) {
      setMessage(
        error instanceof Error && error.message
          ? error.message
          : "We couldn't create your account just now. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, setter) => (value) => {
    setter(value);
    setErrors((current) => ({
      ...current,
      [field]: undefined,
      ...(field === 'password' ? { confirmPassword: undefined } : {}),
    }));
    setMessage('');
  };

  return (
    <Screen
      testID="signup-screen"
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
            Let&apos;s get started
          </Text>
          <Text variant="body" color="muted">
            Create an account and keep your wedding plans close.
          </Text>
        </Stack>

        <Stack gap="md">
          <TextField
            label="Your name"
            value={name}
            onChangeText={updateField('name', setName)}
            placeholder="How should we call you?"
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            returnKeyType="next"
            error={errors.name}
            testID="signup-name"
          />

          <TextField
            label="Email address"
            value={email}
            onChangeText={updateField('email', setEmail)}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            error={errors.email}
            testID="signup-email"
          />

          <TextField
            label="Password"
            value={password}
            onChangeText={updateField('password', setPassword)}
            placeholder="At least 8 characters"
            helper="Use at least 8 characters."
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="next"
            error={errors.password}
            icon={showPassword ? 'eyeOff' : 'eye'}
            onIconPress={() => setShowPassword((visible) => !visible)}
            iconAccessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            testID="signup-password"
          />

          <TextField
            label="Confirm password"
            value={confirmPassword}
            onChangeText={updateField('confirmPassword', setConfirmPassword)}
            placeholder="Enter your password again"
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="done"
            onSubmitEditing={submit}
            error={errors.confirmPassword}
            icon={showConfirmPassword ? 'eyeOff' : 'eye'}
            onIconPress={() => setShowConfirmPassword((visible) => !visible)}
            iconAccessibilityLabel={showConfirmPassword ? 'Hide password' : 'Show password'}
            testID="signup-confirm-password"
          />
        </Stack>

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
          label="Create account"
          onPress={submit}
          loading={loading}
          disabled={loading}
          testID="signup-submit"
        />
      </Stack>

      <Row justify="center" gap="xxs" align="center">
        <Text variant="body" color="muted">Already have an account?</Text>
        <Touchable
          onPress={onSignIn}
          disabled={!onSignIn}
          haptic="light"
          accessibilityLabel="Sign in"
          testID="signup-sign-in"
        >
          <Text variant="label" color="brand">Sign in</Text>
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

export default Signup;