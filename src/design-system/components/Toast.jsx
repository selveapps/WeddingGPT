import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeOutUp, Layout } from 'react-native-reanimated';

import { useTheme, useMotion } from '../theme';
import Text from './Text';
import Icon from './Icon';
import Touchable from './Touchable';
import haptics from '../../lib/haptics';

/**
 * Toast - transient confirmation.
 *
 * The PRD asks for clear confirmation when something is saved (s.17) without
 * interrupting the flow, which is exactly a toast's job. Mounted once at the
 * root; any screen calls `useToast().show(...)`.
 *
 * Toasts appear at the top rather than the bottom: the bottom is occupied by
 * the tab bar and docked CTAs, and a toast that covers the primary action is
 * worse than no toast.
 *
 * Anything requiring a decision belongs in a ConfirmSheet, not here - a toast
 * must always be safely ignorable.
 */

const ToastContext = createContext(null);

const TONE_CONFIG = {
  success: { icon: 'check', bg: 'successSoft', ink: 'successSoftInk', haptic: 'success' },
  info: { icon: 'info', bg: 'infoSoft', ink: 'infoSoftInk', haptic: 'light' },
  warning: { icon: 'alert', bg: 'warningSoft', ink: 'warningSoftInk', haptic: 'warning' },
  error: { icon: 'alert', bg: 'dangerSoft', ink: 'dangerSoftInk', haptic: 'error' },
};

const DEFAULT_DURATION = 2800;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());
  const counter = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (message, options = {}) => {
      const {
        tone = 'success',
        duration = DEFAULT_DURATION,
        actionLabel,
        onAction,
        haptic: hapticOverride,
      } = options;

      const id = `toast_${counter.current++}`;
      const config = TONE_CONFIG[tone] ?? TONE_CONFIG.info;

      const intent = hapticOverride === null ? null : hapticOverride ?? config.haptic;
      if (intent && haptics[intent]) haptics[intent]();

      setToasts((current) => {
        // Cap the stack - three simultaneous toasts is already too many, and
        // letting them pile up would cover the screen.
        const next = [...current, { id, message, tone, actionLabel, onAction }];
        return next.slice(-3);
      });

      if (duration > 0) {
        timers.current.set(id, setTimeout(() => dismiss(id), duration));
      }

      return id;
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      show,
      dismiss,
      success: (message, options) => show(message, { ...options, tone: 'success' }),
      info: (message, options) => show(message, { ...options, tone: 'info' }),
      warning: (message, options) => show(message, { ...options, tone: 'warning' }),
      error: (message, options) => show(message, { ...options, tone: 'error' }),
    }),
    [show, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastViewport({ toasts, onDismiss }) {
  const insets = useSafeAreaInsets();
  const { spacing } = useTheme();

  if (toasts.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.viewport,
        { top: insets.top + spacing.xs, paddingHorizontal: spacing.md, gap: spacing.xs },
      ]}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </View>
  );
}

function ToastItem({ toast, onDismiss }) {
  const { colors, spacing, radii, shadows } = useTheme();
  const motion = useMotion();
  const config = TONE_CONFIG[toast.tone] ?? TONE_CONFIG.info;

  const entering = motion.reduceMotion ? undefined : FadeInDown.springify().damping(18);
  const exiting = motion.reduceMotion ? undefined : FadeOutUp.duration(motion.durations.fast);

  return (
    <Animated.View
      entering={entering}
      exiting={exiting}
      layout={motion.reduceMotion ? undefined : Layout.springify().damping(20)}
      accessibilityLiveRegion="polite"
      accessible
      accessibilityLabel={toast.message}
      style={[
        styles.toast,
        shadows.lg,
        {
          backgroundColor: colors[config.bg],
          borderRadius: radii.md,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
          gap: spacing.xs,
        },
      ]}
    >
      <Icon name={config.icon} size="md" color={colors[config.ink]} />

      <Text variant="bodySm" style={{ flex: 1, color: colors[config.ink] }} numberOfLines={3}>
        {toast.message}
      </Text>

      {toast.actionLabel && toast.onAction && (
        <Touchable
          onPress={() => {
            toast.onAction();
            onDismiss(toast.id);
          }}
          haptic="light"
          scaleOnPress={false}
          accessibilityLabel={toast.actionLabel}
        >
          <Text variant="actionSm" style={{ color: colors[config.ink] }}>
            {toast.actionLabel}
          </Text>
        </Touchable>
      )}

      <Touchable
        onPress={() => onDismiss(toast.id)}
        haptic={null}
        scaleOnPress={false}
        hitSlop={10}
        accessibilityLabel="Dismiss"
      >
        <Icon name="close" size="sm" color={colors[config.ink]} />
      </Touchable>
    </Animated.View>
  );
}

/** Throws outside a provider - a missing ToastProvider is a wiring bug. */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast() must be used inside <ToastProvider>.');
  return context;
}

const styles = StyleSheet.create({
  viewport: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default ToastProvider;
