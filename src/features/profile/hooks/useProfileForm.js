import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  useWeddingStore,
  selectUser,
  selectCouple,
  selectWedding,
  resetAllStores,
} from '@/store';
import { analytics, AnalyticsEvents } from '@/services/analytics';
import haptics from '@/lib/haptics';

import {
  valuesFromWorkspace,
  areProfileValuesEqual,
  buildWorkspacePatches,
  calculateProfileCompleteness,
  toggleListValue,
  parseGuestCountInput,
} from '../lib/profileHelpers';
import {
  validateProfileValues,
  validateProfileField,
  sectionForProfileField,
} from '../lib/profileValidation';
import { PROFILE_COPY } from '../lib/profileConstants';

/**
 * Owns all Profile form state: values, errors, dirty tracking and persistence.
 *
 * The screen stays a thin composition of presentational pieces; this hook is
 * the only place that talks to the wedding store for reads and writes, so a
 * future "edit wedding" sheet can reuse the same behaviour without forking it.
 */
export function useProfileForm() {
  const user = useWeddingStore(selectUser);
  const couple = useWeddingStore(selectCouple);
  const wedding = useWeddingStore(selectWedding);
  const updateUser = useWeddingStore((state) => state.updateUser);
  const updateCouple = useWeddingStore((state) => state.updateCouple);
  const updateWedding = useWeddingStore((state) => state.updateWedding);

  const workspaceValues = useMemo(
    () => valuesFromWorkspace({ user, couple, wedding }),
    [user, couple, wedding]
  );

  const [values, setValues] = useState(workspaceValues);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(true);
  const [focusedSection, setFocusedSection] = useState(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);

  // Track the last workspace snapshot we synced from, so an external store
  // update (e.g. invite sheet writing partnerName) refreshes the form when
  // the user is not mid-edit with dirty fields.
  const lastSyncedRef = useRef(workspaceValues);

  useEffect(() => {
    const dirty = !areProfileValuesEqual(values, lastSyncedRef.current);
    if (dirty) return;
    if (areProfileValuesEqual(workspaceValues, lastSyncedRef.current)) return;
    setValues(workspaceValues);
    lastSyncedRef.current = workspaceValues;
    setErrors({});
  }, [workspaceValues, values]);

  const dirty = useMemo(
    () => !areProfileValuesEqual(values, workspaceValues),
    [values, workspaceValues]
  );

  const completeness = useMemo(() => calculateProfileCompleteness(values), [values]);

  const setField = useCallback((key, next) => {
    setValues((prev) => ({ ...prev, [key]: next }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  }, []);

  const blurField = useCallback(
    (key) => {
      setValues((prev) => {
        const error = validateProfileField(key, prev[key], prev);
        setErrors((errs) => {
          if (error) return { ...errs, [key]: error };
          if (!errs[key]) return errs;
          const copy = { ...errs };
          delete copy[key];
          return copy;
        });
        return prev;
      });
    },
    []
  );

  const toggleStyle = useCallback((styleKey) => {
    setValues((prev) => ({
      ...prev,
      styleTags: toggleListValue(prev.styleTags, styleKey),
    }));
  }, []);

  const toggleStressor = useCallback((stressorKey) => {
    setValues((prev) => ({
      ...prev,
      stressors: toggleListValue(prev.stressors, stressorKey),
    }));
  }, []);

  const setGuestCountFromText = useCallback((text) => {
    setField('guestCountEstimate', parseGuestCountInput(text));
  }, [setField]);

  const setGuestCountOption = useCallback((value) => {
    setField('guestCountEstimate', value);
  }, [setField]);

  const applyLocation = useCallback(
    (place) => {
      setValues((prev) => ({
        ...prev,
        city: place?.city ?? place?.label ?? prev.city,
        region: place?.region ?? prev.region,
        country: place?.country ?? prev.country,
      }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next.city;
        delete next.region;
        delete next.country;
        return next;
      });
    },
    []
  );

  const discard = useCallback(() => {
    setValues(workspaceValues);
    lastSyncedRef.current = workspaceValues;
    setErrors({});
    setDiscardConfirmOpen(false);
    haptics.light();
    return PROFILE_COPY.discardedToast;
  }, [workspaceValues]);

  const requestDiscard = useCallback(() => {
    if (!dirty) return null;
    setDiscardConfirmOpen(true);
    return null;
  }, [dirty]);

  const save = useCallback(async () => {
    if (!wedding) {
      return { ok: false, toast: PROFILE_COPY.emptyWeddingToast, tone: 'info' };
    }

    const { isValid, errors: nextErrors } = validateProfileValues(values);
    if (!isValid) {
      setErrors(nextErrors);
      const firstKey = Object.keys(nextErrors)[0];
      setFocusedSection(sectionForProfileField(firstKey));
      haptics.error();
      return {
        ok: false,
        toast: nextErrors[firstKey] ?? 'Please fix the highlighted fields.',
        tone: 'error',
        section: sectionForProfileField(firstKey),
      };
    }

    setSaving(true);
    try {
      const patches = buildWorkspacePatches(values);
      updateUser(patches.user);
      updateCouple(patches.couple);
      updateWedding(patches.wedding);

      // Re-read after write is unnecessary - zustand updates synchronously and
      // the workspaceValues memo will catch up on the next render. We still
      // snap the local baseline so dirty clears immediately.
      const nextBaseline = valuesFromWorkspace({
        user: { ...user, ...patches.user },
        couple: { ...couple, ...patches.couple },
        wedding: { ...wedding, ...patches.wedding },
      });
      setValues(nextBaseline);
      lastSyncedRef.current = nextBaseline;
      setErrors({});
      setFocusedSection(null);

      analytics.track('profile_updated', {
        completeness: calculateProfileCompleteness(nextBaseline).percent,
        hasPartner: Boolean(nextBaseline.partnerName),
        hasDate: Boolean(nextBaseline.date),
      });

      haptics.success();
      return { ok: true, toast: PROFILE_COPY.savedToast, tone: 'success' };
    } finally {
      setSaving(false);
    }
  }, [wedding, values, updateUser, updateCouple, updateWedding, user, couple]);

  const confirmReset = useCallback(() => {
    resetAllStores();
    setResetConfirmOpen(false);
    haptics.warning();
    analytics.track(AnalyticsEvents.ACCOUNT_DELETED);
    return PROFILE_COPY.dangerSuccessToast;
  }, []);

  return {
    // entity presence
    hasWedding: Boolean(wedding),
    user,
    couple,
    wedding,

    // form
    values,
    errors,
    dirty,
    saving,
    editing,
    setEditing,
    completeness,
    focusedSection,
    setFocusedSection,

    // field writers
    setField,
    blurField,
    toggleStyle,
    toggleStressor,
    setGuestCountFromText,
    setGuestCountOption,
    applyLocation,

    // actions
    save,
    discard,
    requestDiscard,
    discardConfirmOpen,
    setDiscardConfirmOpen,
    resetConfirmOpen,
    setResetConfirmOpen,
    confirmReset,
  };
}

export default useProfileForm;
