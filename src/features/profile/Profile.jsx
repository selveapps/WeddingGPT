import React, { useCallback, useState } from 'react';

import { Screen, Stack, PageHeader, ConfirmSheet, EmptyState, useToast } from '@/design-system/components';
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
  ProfileStickyActions,
  ProfileFeatureHub,
} from './components';
import { PROFILE_FEATURE_CATEGORIES } from './components/ProfileFeatureHub';
import { PROFILE_COPY, PROFILE_SECTIONS } from './lib/profileConstants';
import { WeddingTimeline } from './timeline';
import { ProfilePrivacy } from './privacy';
import { ProfilePreferences } from './preferences';
import { CoupleJournal } from './journal';
import { KeepsakeCollection } from './keepsakes';
import { RelationshipMilestones } from './milestones';
import { CoupleGoals } from './goals';
import { ProfileShareSummary } from './sharing';
import { WeddingDocuments } from './documents';
import { CoupleCheckIns } from './checkins';
import { ProfileBudgetSnapshot } from './budget';
import { WeddingCountdown } from './countdown';
import { WeddingPartyRoster } from './party';
import { WeddingDecisionLog } from './decisions';
import { WeddingVisionBoard } from './visionBoard';
import { Contact } from './contact';

/**
 * Profile - the couple, the day, and the soft facts the plan leans on.
 *
 * The landing page summarizes the wedding and links into categorized profile
 * tools. Each tool is shown on its own focused view to avoid one long screen.
 *
 * Feature files live in `components/`, `fields/`, `hooks/`, `lib/` and the
 * profile-specific collections. This file is the screen shell only.
 */
export function Profile() {
  const { spacing } = useTheme();
  const toast = useToast();
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeFeature, setActiveFeature] = useState(null);

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

  /** Open a form section from a prompt (hero, Next up, snapshot tile). */
  const openSection = useCallback(
    (sectionId) => {
      if (!sectionId) return;
      form.setFocusedSection(sectionId);
      form.setEditing(true);
      setActiveCategory('wedding');
      setActiveFeature('details');
    },
    [form]
  );

  const openFeature = useCallback((featureId) => {
    setActiveFeature(featureId);
  }, []);

  /** Manual tab switches clear the highlight so the same prompt can re-trigger it. */
  const handleSectionChange = useCallback(() => {
    form.setFocusedSection(null);
  }, [form]);

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
        {activeFeature ? (
          <>
            <PageHeader
              eyebrow={PROFILE_COPY.screenEyebrow}
              title={getFeatureTitle(activeCategory, activeFeature)}
              actionLabel="Back to tools"
              onActionPress={() => setActiveFeature(null)}
            />
            {renderProfileFeature(activeFeature, {
              form,
              handleSave,
              handleDiscardRequest,
              handleSectionChange,
              handleResetConfirm,
              openSection,
            })}
          </>
        ) : activeCategory ? (
          <ProfileFeatureHub
            categoryId={activeCategory}
            onSelectFeature={openFeature}
            onBack={() => setActiveCategory(null)}
          />
        ) : (
          <>
            <PageHeader
              eyebrow={PROFILE_COPY.screenEyebrow}
              title={PROFILE_COPY.screenTitle}
              subtitle={PROFILE_COPY.screenSubtitle}
            />
            <Stack gap="md">
              <ProfileHero
                values={form.values}
                completenessPercent={form.completeness.percent}
                onPartnerPress={() => openSection(PROFILE_SECTIONS.PARTNER)}
              />
              <ProfileCompleteness completeness={form.completeness} onMissingPress={openSection} />
            </Stack>
            <ProfileSummaryCard values={form.values} onTilePress={openSection} />
            <ProfileFeatureHub onSelectCategory={setActiveCategory} />
          </>
        )}
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

function getFeatureTitle(categoryId, featureId) {
  const category = PROFILE_FEATURE_CATEGORIES.find((item) => item.id === categoryId);
  return category?.features.find((feature) => feature.id === featureId)?.title ?? 'Profile';
}

function renderProfileFeature(feature, handlers) {
  const { form, handleSave, handleDiscardRequest, handleSectionChange, handleResetConfirm } = handlers;

  switch (feature) {
    case 'details':
      return (
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
          onSectionChange={handleSectionChange}
          showActions={false}
        />
      );
    case 'countdown':
      return <WeddingCountdown />;
    case 'budget':
      return <ProfileBudgetSnapshot />;
    case 'timeline':
      return <WeddingTimeline />;
    case 'preferences':
      return <ProfilePreferences />;
    case 'privacy':
      return <ProfilePrivacy />;
    case 'journal':
      return <CoupleJournal />;
    case 'keepsakes':
      return <KeepsakeCollection />;
    case 'milestones':
      return <RelationshipMilestones />;
    case 'goals':
      return <CoupleGoals />;
    case 'checkins':
      return <CoupleCheckIns />;
    case 'documents':
      return <WeddingDocuments />;
    case 'contacts':
      return <Contact embedded />;
    case 'party':
      return <WeddingPartyRoster />;
    case 'decisions':
      return <WeddingDecisionLog />;
    case 'vision':
      return <WeddingVisionBoard />;
    case 'sharing':
      return <ProfileShareSummary values={form.values} />;
    case 'accountSettings':
      return (
        <>
          <ProfileSettingsLinks />
          <ProfileDangerZone
            confirmOpen={form.resetConfirmOpen}
            onRequestReset={() => form.setResetConfirmOpen(true)}
            onCancelReset={() => form.setResetConfirmOpen(false)}
            onConfirmReset={handleResetConfirm}
          />
        </>
      );
    default:
      return null;
  }
}

export default Profile;
