import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandStorage } from '../services/storage';
import {
  createUser,
  createCouple,
  createWedding,
  touchEntity,
  OnboardingStatus,
} from '../models';

/**
 * The wedding workspace root: user, couple, wedding, and onboarding progress.
 *
 * Onboarding answers live here as a `draft` that is written on every single
 * answer. PRD s.4.3 is explicit that closing the app mid-onboarding must lose
 * nothing and must resume at the right step - so the draft and `currentStep`
 * persist independently of the finished Wedding entity, which is only built at
 * the end from the accumulated draft.
 *
 * Every store in the app follows this shape: plain state, actions that own all
 * mutation, and selectors exported separately so components subscribe to the
 * narrowest slice they need and do not re-render on unrelated changes.
 */

const initialState = {
  user: null,
  couple: null,
  wedding: null,

  onboardingStatus: OnboardingStatus.NOT_STARTED,
  /** Index into the onboarding step list. Persisted so we resume correctly. */
  onboardingStep: 0,
  /** Raw answers, keyed by step id. Survives an app kill mid-flow. */
  draft: {},

  /** Set once the personalised plan has been generated and shown. */
  planGeneratedAt: null,
};

export const useWeddingStore = create()(
  persist(
    (set, get) => ({
      ...initialState,

      // --- Onboarding -------------------------------------------------------
      startOnboarding() {
        if (get().onboardingStatus === OnboardingStatus.COMPLETED) return;
        set({ onboardingStatus: OnboardingStatus.IN_PROGRESS });
      },

      /** Persist a single answer. Called on every interaction, not on Next. */
      saveAnswer(key, value) {
        set((state) => ({
          draft: { ...state.draft, [key]: value },
          onboardingStatus:
            state.onboardingStatus === OnboardingStatus.NOT_STARTED
              ? OnboardingStatus.IN_PROGRESS
              : state.onboardingStatus,
        }));
      },

      setOnboardingStep(step) {
        set({ onboardingStep: Math.max(0, step) });
      },

      /** Build the real entities from the draft and mark onboarding done. */
      completeOnboarding() {
        const { draft } = get();

        const user = createUser({ name: draft.firstName ?? '' });
        const couple = createCouple({
          userId: user.id,
          partnerName: draft.partnerName ?? '',
          collaborationEnabled: Boolean(draft.partnerWillCollaborate),
        });
        const wedding = createWedding({
          coupleId: couple.id,
          ownerName: draft.firstName ?? '',
          partnerName: draft.partnerName ?? '',
          date: draft.weddingDate ?? null,
          dateType: draft.dateType,
          city: draft.city ?? '',
          region: draft.region ?? '',
          country: draft.country ?? '',
          guestCountEstimate: draft.guestCount ?? null,
          budgetTotal: draft.budgetTotal ?? null,
          currency: draft.currency,
          planningStage: draft.planningStage,
          ceremonyType: draft.ceremonyType,
          styleTags: draft.styleTags ?? [],
          stressors: draft.stressors ?? [],
        });

        set({
          user,
          couple,
          wedding,
          onboardingStatus: OnboardingStatus.COMPLETED,
        });

        return wedding;
      },

      markPlanGenerated() {
        const { wedding } = get();
        const now = new Date().toISOString();
        set({
          planGeneratedAt: now,
          wedding: wedding ? touchEntity(wedding, { planGeneratedAt: now }) : wedding,
        });
      },

      // --- Wedding details --------------------------------------------------
      updateWedding(patch) {
        const { wedding } = get();
        if (!wedding) return;
        set({ wedding: touchEntity(wedding, patch) });
      },

      updateUser(patch) {
        const { user } = get();
        if (!user) return;
        set({ user: touchEntity(user, patch) });
      },

      updateCouple(patch) {
        const { couple } = get();
        if (!couple) return;
        set({ couple: touchEntity(couple, patch) });
      },

      /** Full wipe, for "delete account" and for development resets. */
      reset() {
        set({ ...initialState });
      },
    }),
    {
      name: 'wedding:store',
      storage: zustandStorage,
      version: 1,
      // Actions are recreated on every load; persisting them would be dead weight.
      partialize: (state) => ({
        user: state.user,
        couple: state.couple,
        wedding: state.wedding,
        onboardingStatus: state.onboardingStatus,
        onboardingStep: state.onboardingStep,
        draft: state.draft,
        planGeneratedAt: state.planGeneratedAt,
      }),
    }
  )
);

// --- Selectors ---------------------------------------------------------------
// Components use these rather than reading the store object, so a change to one
// field never re-renders a screen that does not use it.

export const selectWedding = (state) => state.wedding;
export const selectWeddingId = (state) => state.wedding?.id ?? null;
export const selectUser = (state) => state.user;
export const selectCouple = (state) => state.couple;
export const selectOnboardingStatus = (state) => state.onboardingStatus;
export const selectOnboardingStep = (state) => state.onboardingStep;
export const selectDraft = (state) => state.draft;

export const selectHasCompletedOnboarding = (state) =>
  state.onboardingStatus === OnboardingStatus.COMPLETED;
