import { AnalyticsEvents, AnalyticsEventNames } from './events';

export { AnalyticsEvents, AnalyticsEventNames } from './events';

/**
 * AnalyticsService.
 *
 * Screens call `analytics.track(AnalyticsEvents.TASK_COMPLETED, { ... })` and
 * never touch a vendor SDK. Swapping providers (Amplitude, PostHog, Segment)
 * means registering a different provider here - no screen changes, which is the
 * requirement in PRD s.26.
 *
 * A provider is any object with `{ identify, track, screen, reset, flush }`.
 * All methods are optional; missing ones are simply skipped.
 */

/** Logs to the console in development, silent in production. Ships as the default. */
export function createConsoleAnalyticsProvider() {
  return {
    name: 'console',
    identify(userId, traits) {
      if (__DEV__) console.log('[analytics] identify', userId, traits ?? {});
    },
    track(event, properties) {
      if (__DEV__) console.log('[analytics] track', event, properties ?? {});
    },
    screen(name, properties) {
      if (__DEV__) console.log('[analytics] screen', name, properties ?? {});
    },
    reset() {
      if (__DEV__) console.log('[analytics] reset');
    },
  };
}

/** Discards everything. Used in tests and when the user opts out of analytics. */
export function createNoopAnalyticsProvider() {
  return { name: 'noop' };
}

function createAnalytics(initialProvider) {
  let provider = initialProvider;
  let enabled = true;
  /** Properties attached to every subsequent event, e.g. planning stage, days out. */
  let superProperties = {};

  const call = (method, ...args) => {
    if (!enabled || !provider || typeof provider[method] !== 'function') return;
    try {
      provider[method](...args);
    } catch (error) {
      // Analytics must never break a user flow.
      if (__DEV__) console.warn(`[analytics] provider.${method} threw`, error);
    }
  };

  return {
    /** Swap the backing provider at runtime. */
    setProvider(next) {
      provider = next;
    },

    getProviderName() {
      return provider?.name ?? 'none';
    },

    /** Honours a privacy opt-out from the account settings screen. */
    setEnabled(next) {
      enabled = Boolean(next);
      if (!enabled) call('reset');
    },

    isEnabled() {
      return enabled;
    },

    /** Merge properties sent with every future event. */
    register(properties) {
      superProperties = { ...superProperties, ...properties };
    },

    identify(userId, traits) {
      call('identify', userId, traits);
    },

    track(event, properties) {
      if (__DEV__ && !AnalyticsEventNames.includes(event)) {
        console.warn(
          `[analytics] "${event}" is not in AnalyticsEvents. Add it there so the taxonomy stays auditable.`
        );
      }
      call('track', event, { ...superProperties, ...properties });
    },

    screen(name, properties) {
      call('screen', name, { ...superProperties, ...properties });
      call('track', AnalyticsEvents.SCREEN_VIEWED, {
        ...superProperties,
        ...properties,
        screen: name,
      });
    },

    reset() {
      superProperties = {};
      call('reset');
    },

    async flush() {
      if (typeof provider?.flush === 'function') await provider.flush();
    },
  };
}

export const analytics = createAnalytics(createConsoleAnalyticsProvider());

export default analytics;
