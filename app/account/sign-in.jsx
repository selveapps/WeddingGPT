import React, { useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  Screen,
  Stack,
  Text,
  Card,
  Button,
  TextField,
  ScreenHeader,
  SegmentedControl,
  useToast,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { useAuthStore, selectAuthAvailable } from '@/store';
import { AuthErrorCode } from '@/services/auth';
import { Mascot } from '@/features/mascot/Mascot';
import {
  AuthMode,
  PASSWORD_MIN_LENGTH,
  validateAuthField,
  validateAuthForm,
} from '@/features/auth/authValidation';

const MODE_OPTIONS = [
  { value: AuthMode.SIGN_IN, label: 'Sign in' },
  { value: AuthMode.SIGN_UP, label: 'Create account' },
];

const EMPTY = { name: '', email: '', password: '' };

/**
 * Sign in, or create an account, on one screen.
 *
 * Accounts are optional - the wedding stays on this device either way - so the
 * copy never suggests anything is locked. Errors are checked on blur and on
 * submit, never per keystroke, and a server error lands on the field it is
 * about when there is one.
 */
export default function SignInScreen() {
  const router = useRouter();
  const toast = useToast();
  const { spacing } = useTheme();
  const params = useLocalSearchParams();

  const available = useAuthStore(selectAuthAvailable);
  const signIn = useAuthStore((state) => state.signIn);
  const signUp = useAuthStore((state) => state.signUp);

  const [mode, setMode] = useState(params.mode === AuthMode.SIGN_UP ? AuthMode.SIGN_UP : AuthMode.SIGN_IN);
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const isSignUp = mode === AuthMode.SIGN_UP;

  const change = (field) => (next) => {
    setValues((current) => ({ ...current, [field]: next }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
    if (formError) setFormError(null);
  };

  const blur = (field) => () => {
    // Do not scold an untouched field just because focus moved past it.
    if (!values[field]) return;
    const error = validateAuthField(mode, field, values[field]);
    setErrors((current) => ({ ...current, [field]: error ?? undefined }));
  };

  const switchMode = (next) => {
    setMode(next);
    setErrors({});
    setFormError(null);
  };

  const submit = async () => {
    if (submitting) return;
    const { isValid, errors: found } = validateAuthForm(mode, values);
    if (!isValid) {
      setErrors(found);
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const user = isSignUp
        ? await signUp(values)
        : await signIn({ email: values.email, password: values.password });
      toast.success(isSignUp ? 'Your account is ready' : `Welcome back${user.name ? `, ${user.name}` : ''}`);
      router.back();
    } catch (error) {
      if (error?.code === AuthErrorCode.INVALID && error.fields) setErrors(error.fields);
      else if (error?.code === AuthErrorCode.EMAIL_TAKEN) setErrors({ email: error.message });
      else setFormError(error?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!available) {
    return (
      <Screen bottomInset={spacing.xxl}>
        <Stack gap="lg">
          <ScreenHeader eyebrow="Account" title="Sign in" />
          <Card tone="sunken">
            <Text variant="bodySm" color="muted">
              Accounts are not switched on in this build yet. Everything you plan is still saved on this
              device.
            </Text>
          </Card>
        </Stack>
      </Screen>
    );
  }

  return (
    <Screen
      bottomInset={spacing.xxl}
      footer={
        <Button
          label={isSignUp ? 'Create account' : 'Sign in'}
          onPress={submit}
          loading={submitting}
          testID="auth-submit"
        />
      }
    >
      <Stack gap="lg">
        <ScreenHeader eyebrow="Account" title={isSignUp ? 'Create an account' : 'Sign in'} />

        <Stack gap="sm" style={{ alignItems: 'center' }}>
          <Mascot size={88} mood="wave" />
          <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
            {isSignUp
              ? 'An account keeps your login safe for when planning moves beyond this phone.'
              : 'Welcome back. Your plan is right where you left it.'}
          </Text>
        </Stack>

        <SegmentedControl options={MODE_OPTIONS} value={mode} onChange={switchMode} />

        <Stack gap="md">
          {isSignUp ? (
            <TextField
              label="Your name"
              value={values.name}
              onChangeText={change('name')}
              onBlur={blur('name')}
              placeholder="Optional"
              error={errors.name}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
            />
          ) : null}

          <TextField
            ref={emailRef}
            label="Email"
            value={values.email}
            onChangeText={change('email')}
            onBlur={blur('email')}
            placeholder="you@example.com"
            error={errors.email}
            required
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType={isSignUp ? 'username' : 'emailAddress'}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            testID="auth-email"
          />

          <TextField
            ref={passwordRef}
            label="Password"
            value={values.password}
            onChangeText={change('password')}
            onBlur={blur('password')}
            helper={isSignUp ? `At least ${PASSWORD_MIN_LENGTH} characters.` : undefined}
            error={errors.password}
            required
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            textContentType={isSignUp ? 'newPassword' : 'password'}
            icon={showPassword ? 'eyeOff' : 'eye'}
            onIconPress={() => setShowPassword((shown) => !shown)}
            iconAccessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            returnKeyType="go"
            onSubmitEditing={submit}
            testID="auth-password"
          />
        </Stack>

        {formError ? (
          <Card tone="sunken">
            <Text variant="bodySm" color="danger" accessibilityLiveRegion="polite">
              {formError}
            </Text>
          </Card>
        ) : null}
      </Stack>
    </Screen>
  );
}
