/**
 * useSettings — primary hook for Settings screens.
 *
 * Wraps the zustand store with stable setters, section reset, search, and
 * derived summaries so screens stay thin.
 */

import { useCallback, useMemo, useState } from 'react';

import {
  useSettingsStore,
  DEFAULT_SETTINGS,
  privacyScore,
  listChangedKeys,
} from '@/store/settingsStore';
import {
  SETTINGS_HUB_LINKS,
  SECTION_RESET_KEYS,
  SETTINGS_COPY,
  searchSettingsSections,
} from '../lib/settingsConstants';
import {
  appearanceSummary,
  notificationSummary,
  privacyScoreLabel,
  sectionHasChanges,
  formatSettingsTimestamp,
  quietHoursActiveNow,
  buildSettingsExportPayload,
  resetConfirmCopy,
} from '../lib/settingsHelpers';

export function useSettings() {
  const store = useSettingsStore();

  const setSetting = useCallback((key, value) => {
    useSettingsStore.getState().setSetting(key, value);
  }, []);

  const setSettings = useCallback((partial) => {
    useSettingsStore.getState().setSettings(partial);
  }, []);

  const toggle = useCallback((key) => {
    useSettingsStore.getState().toggle(key);
  }, []);

  const setNotificationChannel = useCallback((channel, enabled) => {
    useSettingsStore.getState().setNotificationChannel(channel, enabled);
  }, []);

  const setNotificationCategory = useCallback((category, enabled) => {
    useSettingsStore.getState().setNotificationCategory(category, enabled);
  }, []);

  const resetSection = useCallback((sectionId) => {
    const keys = SECTION_RESET_KEYS[sectionId];
    if (keys) useSettingsStore.getState().resetSection(keys);
  }, []);

  const resetAll = useCallback(() => {
    useSettingsStore.getState().resetAll();
  }, []);

  const markExport = useCallback(() => {
    useSettingsStore.getState().markExport();
  }, []);

  const markBackup = useCallback(() => {
    useSettingsStore.getState().markBackup();
  }, []);

  const changedKeys = useMemo(() => listChangedKeys(store), [store]);
  const privacy = useMemo(() => privacyScore(store), [store]);
  const privacyLabel = useMemo(
    () => privacyScoreLabel(privacy.score, privacy.max),
    [privacy]
  );

  const summaries = useMemo(
    () => ({
      appearance: appearanceSummary(store),
      notifications: notificationSummary(store),
      privacy: privacyLabel,
      quietActive: quietHoursActiveNow(store),
      lastExport: formatSettingsTimestamp(store.lastExportAt, store.locale),
      lastBackup: formatSettingsTimestamp(store.lastBackupAt, store.locale),
    }),
    [store, privacyLabel]
  );

  const exportPayload = useCallback(
    (meta) => buildSettingsExportPayload(store, meta),
    [store]
  );

  return {
    settings: store,
    hydrated: store._hydrated,
    defaults: DEFAULT_SETTINGS,
    changedKeys,
    privacy,
    privacyLabel,
    summaries,
    setSetting,
    setSettings,
    toggle,
    setNotificationChannel,
    setNotificationCategory,
    resetSection,
    resetAll,
    markExport,
    markBackup,
    exportPayload,
    sectionHasChanges: (id) => sectionHasChanges(id, store),
    resetConfirmCopy,
    copy: SETTINGS_COPY,
  };
}

/**
 * Hub-only hook: search + navigation list.
 */
export function useSettingsHub() {
  const { settings, summaries, sectionHasChanges, copy } = useSettings();
  const [query, setQuery] = useState('');

  const links = useMemo(() => {
    const base = searchSettingsSections(query);
    return base.map((link) => ({
      ...link,
      dirty: sectionHasChanges(link.id),
      summary:
        link.id === 'appearance'
          ? summaries.appearance
          : link.id === 'notifications'
            ? summaries.notifications
            : link.id === 'privacy'
              ? summaries.privacy
              : link.id === 'data'
                ? `Export ${summaries.lastExport}`
                : link.subtitle,
    }));
  }, [query, summaries, sectionHasChanges]);

  return {
    query,
    setQuery,
    links,
    settings,
    summaries,
    copy,
    empty: links.length === 0,
  };
}

/**
 * Section screen helper: wires reset sheet + save toast pattern.
 */
export function useSettingsSection(sectionId) {
  const api = useSettings();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const dirty = api.sectionHasChanges(sectionId);
  const confirm = api.resetConfirmCopy(
    // title resolved by caller if needed
    undefined
  );

  const requestReset = useCallback(() => setConfirmOpen(true), []);
  const cancelReset = useCallback(() => setConfirmOpen(false), []);
  const confirmReset = useCallback(() => {
    api.resetSection(sectionId);
    setConfirmOpen(false);
  }, [api, sectionId]);

  return {
    ...api,
    sectionId,
    dirty,
    confirmOpen,
    requestReset,
    cancelReset,
    confirmReset,
    confirm,
  };
}

export default useSettings;
