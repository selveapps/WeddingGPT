import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useTheme } from '../theme';
import Text from './Text';
import Button from './Button';
import Icon from './Icon';

/**
 * The four non-content states every feature must implement (PRD s.23 and s.29):
 * empty, error, loading and offline.
 *
 * Centralising them does two things. It guarantees each one actually answers
 * "what can I do next?" - every variant takes an action - and it means adding a
 * new module cannot quietly skip a state, because there is nothing to write:
 * you drop in the component.
 */

function StateShell({ icon, tone = 'brand', title, message, children, compact, style }) {
  const { colors, spacing, radii } = useTheme();

  return (
    <View
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: compact ? spacing.xl : spacing.giant,
          paddingHorizontal: spacing.lg,
          gap: spacing.sm,
        },
        style,
      ]}
    >
      {icon && (
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: radii.pill,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors[`${tone}Soft`] ?? colors.brandSoft,
            marginBottom: spacing.xxs,
          }}
        >
          <Icon name={icon} size="xl" color={colors[`${tone}SoftInk`] ?? colors.brandSoftInk} />
        </View>
      )}

      <Text variant="h3" align="center" heading>
        {title}
      </Text>

      {message && (
        <Text variant="body" color="muted" align="center" style={{ maxWidth: 320 }}>
          {message}
        </Text>
      )}

      {children && <View style={{ marginTop: spacing.sm, alignSelf: 'stretch' }}>{children}</View>}
    </View>
  );
}

/**
 * Empty state. `title` says what is missing, `message` says why it is worth
 * filling, and the action makes it a single tap away.
 */
export function EmptyState({
  icon = 'sparkle',
  title,
  message,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  compact = false,
  style,
}) {
  const { spacing } = useTheme();

  return (
    <StateShell icon={icon} tone="brand" title={title} message={message} compact={compact} style={style}>
      {(actionLabel || secondaryActionLabel) && (
        <View style={{ gap: spacing.xs }}>
          {actionLabel && onAction && (
            <Button label={actionLabel} onPress={onAction} iconLeft="plus" />
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button label={secondaryActionLabel} variant="ghost" onPress={onSecondaryAction} />
          )}
        </View>
      )}
    </StateShell>
  );
}

/** Error state. Always offers a retry - a dead end is never acceptable. */
export function ErrorState({
  title = 'Something went wrong',
  message = 'We could not load this just now. It is usually temporary.',
  onRetry,
  retryLabel = 'Try again',
  compact = false,
  style,
}) {
  return (
    <StateShell icon="alert" tone="danger" title={title} message={message} compact={compact} style={style}>
      {onRetry && <Button label={retryLabel} variant="secondary" iconLeft="refresh" onPress={onRetry} />}
    </StateShell>
  );
}

/** Offline state. Distinct from error: the data is fine, the connection is not. */
export function OfflineState({
  title = 'You are offline',
  message = 'Your wedding workspace is still here. Anything needing the internet will resume once you reconnect.',
  onRetry,
  compact = false,
  style,
}) {
  return (
    <StateShell icon="info" tone="warning" title={title} message={message} compact={compact} style={style}>
      {onRetry && <Button label="Check again" variant="secondary" iconLeft="refresh" onPress={onRetry} />}
    </StateShell>
  );
}

/**
 * Loading state. Prefer a `Skeleton` inside content areas; this is for
 * full-screen waits where there is no shape to imitate yet.
 */
export function LoadingState({ message = 'Just a moment...', compact = false, style }) {
  const { colors, spacing } = useTheme();

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={message}
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: compact ? spacing.xl : spacing.giant,
          gap: spacing.sm,
        },
        style,
      ]}
    >
      <ActivityIndicator color={colors.brand} />
      {message && (
        <Text variant="bodySm" color="muted" align="center">
          {message}
        </Text>
      )}
    </View>
  );
}

export default EmptyState;
