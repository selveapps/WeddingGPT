import React, { useCallback } from 'react';

import {
  Screen,
  Stack,
  PageHeader,
  ConfirmSheet,
  EmptyState,
  useToast,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { buildWorkspace } from '@/features/onboarding/buildWorkspace';

import { useProfileForm } from './hooks/useProfileForm';
import {
  ProfileHero,
  ProfileCompleteness,
  ProfileSummaryCard,
  ProfileForm,
  ProfileSettingsLinks,
  ProfileDangerZone,
  ProfileTips,
  ProfileStickyActions,
} from './components';
import { PROFILE_COPY } from './lib/profileConstants';

/**
 * Profile - the couple, the day, and the soft facts the plan leans on.
 *
 * Feature files live in `components/`, `fields/`, `hooks/`, `lib/` and
 * `booking/`. This file is the screen shell only.
 */
export function Profile() {
  const { spacing } = useTheme();
  const toast = useToast();

  const form = useProfileForm();

  const showToast = useCallback(
    (result) => {
      if (!result?.toast) return;
      if (result.tone === 'error') toast.error(result.toast);
      else if (result.tone === 'info') toast.info(result.toast);
      else toast.success(result.toast);
    },
    [toast]
  );

  const handleSave = useCallback(async () => {
    const result = await form.save();
    showToast(result);
  }, [form, showToast]);

  const handleDiscardRequest = useCallback(() => {
    if (!form.dirty) return;
    form.requestDiscard();
  }, [form]);

  const handleDiscardConfirm = useCallback(() => {
    const message = form.discard();
    if (message) toast.info(message);
  }, [form, toast]);

  const handleResetConfirm = useCallback(() => {
    const message = form.confirmReset();
    if (message) toast.success(message);
  }, [form, toast]);

  const handleMissingPress = useCallback(
    (sectionId) => {
      form.setFocusedSection(sectionId);
      form.setEditing(true);
    },
    [form]
  );

  const handleSetup = useCallback(() => {
    buildWorkspace();
    toast.success('Your wedding workspace is ready.');
  }, [toast]);

  if (!form.hasWedding) {
    return (
      <Screen bottomInset={spacing.xxl}>
        <Stack gap="lg">
          <PageHeader
            eyebrow={PROFILE_COPY.screenEyebrow}
            title={PROFILE_COPY.screenTitle}
            subtitle={PROFILE_COPY.screenSubtitle}
          />
          <EmptyState
            icon="user"
            title="No wedding yet"
            message="Set up a workspace on this device and your profile will live here."
            actionLabel="Set up my wedding"
            onAction={handleSetup}
          />
        </Stack>
      </Screen>
    );
  }

  return (
    <Screen
      bottomInset={spacing.xxl}
      footer={
        form.dirty ? (
          <ProfileStickyActions
            dirty
            saving={form.saving}
            onSave={handleSave}
            onDiscard={handleDiscardRequest}
          />
        ) : null
      }
    >
      <Stack gap="xl">
        <PageHeader
          eyebrow={PROFILE_COPY.screenEyebrow}
          title={PROFILE_COPY.screenTitle}
          subtitle={PROFILE_COPY.screenSubtitle}
        />

        <ProfileHero
          values={form.values}
          completenessPercent={form.completeness.percent}
        />

        <ProfileCompleteness
          completeness={form.completeness}
          onMissingPress={handleMissingPress}
        />

        <ProfileTips
          missing={form.completeness.missing}
          onTipPress={handleMissingPress}
        />

        <ProfileSummaryCard values={form.values} />

        <ProfileForm
          values={form.values}
          errors={form.errors}
          dirty={form.dirty}
          saving={form.saving}
          focusedSection={form.focusedSection}
          onChange={form.setField}
          onBlur={form.blurField}
          onLocate={form.applyLocation}
          onGuestCountOption={form.setGuestCountOption}
          onSave={handleSave}
          onDiscard={handleDiscardRequest}
          showActions={false}
        />

        <ProfileSettingsLinks />

        <ProfileDangerZone
          confirmOpen={form.resetConfirmOpen}
          onRequestReset={() => form.setResetConfirmOpen(true)}
          onCancelReset={() => form.setResetConfirmOpen(false)}
          onConfirmReset={handleResetConfirm}
        />
      </Stack>

      <ConfirmSheet
        visible={form.discardConfirmOpen}
        onClose={() => form.setDiscardConfirmOpen(false)}
        onConfirm={handleDiscardConfirm}
        title="Discard changes?"
        message="Your unsaved edits will be lost. The last saved profile stays as it is."
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        destructive
        icon="trash"
      />
    </Screen>
  );
}

export default Profile;
