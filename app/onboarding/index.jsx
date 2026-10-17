import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, KeyboardAvoidingView, Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import {
  Screen,
  Stack,
  Row,
  Text,
  Button,
  TextField,
  ProgressBar,
  Touchable,
  Icon,
} from '@/design-system/components';
import { useTheme, useMotion } from '@/design-system/theme';
import { Routes } from '@/navigation/routes';
import {
  useWeddingStore,
  selectOnboardingStep,
  selectDraft,
  selectOnboardingStatus,
} from '@/store';
import { analytics, AnalyticsEvents } from '@/services/analytics';
import { OnboardingStatus, StepKind, ONBOARDING_STEPS, ONBOARDING_STEP_COUNT, clampStepIndex } from '@/models';
import haptics from '@/lib/haptics';
import { Companion } from '@/features/onboarding/Companion';
import { ChoiceAnswer } from '@/features/onboarding/ChoiceAnswer';
import { DateAnswer } from '@/features/onboarding/DateAnswer';
import { LocationField } from '@/features/local/LocationField';
import { buildWorkspace } from '@/features/onboarding/buildWorkspace';
import { FloatingHearts } from '@/features/launch/FloatingHearts';

/** Index of the hello screen that precedes the first question. */
const WELCOME = -1;

/** Long enough to see the pick land, short enough not to feel like waiting. */
const AUTO_ADVANCE_MS = 420;

/**
 * The onboarding journey - one screen, not a stack of them.
 *
 * The companion stays mounted from hello to the last question; only the answer
 * area beneath it slides. Choice steps move on by themselves the moment one is
 * picked, so most of the flow is a handful of taps. Skip sits in the corner of every
 * step and drops the couple straight onto their dashboard, built from whatever
 * they have answered so far - nothing here is a gate.
 *
 * Answers are written to the store on every tap and keystroke, and the step
 * index is persisted as it changes, so closing the app mid-flow resumes on the
 * same question with nothing lost.
 */
export default function OnboardingJourney() {
  const router = useRouter();
  const { spacing, colors } = useTheme();
  const motion = useMotion();

  const draft = useWeddingStore(selectDraft);
  const status = useWeddingStore(selectOnboardingStatus);
  const savedStep = useWeddingStore(selectOnboardingStep);
  const saveAnswer = useWeddingStore((state) => state.saveAnswer);
  const setOnboardingStep = useWeddingStore((state) => state.setOnboardingStep);
  const startOnboarding = useWeddingStore((state) => state.startOnboarding);

  const resuming = status === OnboardingStatus.IN_PROGRESS && Object.keys(draft ?? {}).length > 0;

  const [index, setIndex] = useState(() => (resuming ? clampStepIndex(savedStep) : WELCOME));

  const advanceTimer = useRef(null);
  const finished = useRef(false);

  const step = index === WELCOME ? null : ONBOARDING_STEPS[index];
  const isLast = index === ONBOARDING_STEP_COUNT - 1;

  useEffect(() => {
    analytics.track(
      resuming ? AnalyticsEvents.ONBOARDING_RESUMED : AnalyticsEvents.ONBOARDING_STARTED,
      { step: savedStep }
    );
    // Once per mount: this is the "did they come back?" signal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => clearTimeout(advanceTimer.current), []);

  useEffect(() => {
    if (index !== WELCOME) setOnboardingStep(index);
  }, [index, setOnboardingStep]);

  const goTo = useCallback(
    (next) => {
      clearTimeout(advanceTimer.current);
      setIndex(next);
    },
    [index]
  );

  /**
   * Leave for the dashboard. `completed` gets the plan reveal on the way; an
   * early exit goes straight to Home, which is already a working dashboard.
   */
  const finish = useCallback(
    (completed) => {
      if (finished.current) return;
      finished.current = true;
      clearTimeout(advanceTimer.current);

      buildWorkspace();
      // The plan reveal plays its own success haptic; an early exit gets a
      // lighter one here so leaving still feels acknowledged.
      if (!completed) haptics.medium();
      analytics.track(
        completed ? AnalyticsEvents.ONBOARDING_COMPLETED : AnalyticsEvents.ONBOARDING_EXITED_EARLY,
        { answered: Object.keys(useWeddingStore.getState().draft ?? {}).length, step: index }
      );
      router.replace(completed ? Routes.plan : Routes.home);
    },
    [index, router]
  );

  const goNext = useCallback(() => {
    if (!step) {
      startOnboarding();
      goTo(0);
      return;
    }
    analytics.track(AnalyticsEvents.ONBOARDING_STEP_COMPLETED, { step: step.id, index });
    if (isLast) finish(true);
    else goTo(index + 1);
  }, [step, index, isLast, startOnboarding, goTo, finish]);

  /** Let the pick register visually, then move on. */
  const advanceSoon = () => {
    clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(goNext, motion.reduceMotion ? 150 : AUTO_ADVANCE_MS);
  };

  const goBack = useCallback(() => {
    if (index === WELCOME) return false;
    goTo(index - 1);
    return true;
  }, [index, goTo]);

  // Android back steps through the journey rather than leaving it.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', goBack);
    return () => sub.remove();
  }, [goBack]);

  // --- Hello ----------------------------------------------------------------
  // The launch intro's hearts keep drifting behind the hello, so the hand-off
  // from logo to companion reads as one moment rather than a cut.
  if (!step) {
    const enter = (delay) => (motion.reduceMotion ? undefined : FadeInDown.duration(560).delay(delay));
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <FloatingHearts count={10} opacity={0.3} />
        <Screen
          background="transparent"
          bottomInset={spacing.xl}
          footer={
            <Animated.View entering={enter(450)}>
              <Stack gap="xs">
                <Button label="Get started" iconRight="arrowRight" onPress={goNext} />
                <Button label="Just show me around" variant="ghost" onPress={() => finish(false)} />
              </Stack>
            </Animated.View>
          }
        >
          <Animated.View entering={enter(100)} style={{ flex: 1, justifyContent: 'center' }}>
            <Companion
              size="lg"
              mood="wave"
              message="Hi! We're here to plan your wedding with you."
              hint="A few quick taps and your plan is ready."
            />
          </Animated.View>
        </Screen>
      </View>
    );
  }

  // --- A question -----------------------------------------------------------
  const showContinue =
    step.kind === StepKind.NAMES || step.kind === StepKind.DATE || step.kind === StepKind.LOCATION;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen
        bottomInset={spacing.lg}
        footer={
          showContinue ? (
            <Animated.View entering={FadeIn.duration(200)}>
              <Button
                label={isLast ? 'Build my plan' : 'Continue'}
                iconRight={isLast ? 'sparkle' : 'arrowRight'}
                onPress={goNext}
              />
            </Animated.View>
          ) : null
        }
      >
        <Stack gap="xl">
          {/* --- Back, progress, skip ---------------------------------------- */}
          <Row gap="sm">
            <Touchable onPress={goBack} haptic="light" accessibilityLabel="Back" hitSlop={12}>
              <Icon name="chevronLeft" size="md" color="inkMuted" />
            </Touchable>

            <ProgressBar
              value={(index + 1) / ONBOARDING_STEP_COUNT}
              height={10}
              style={{ flex: 1 }}
              accessibilityLabel={`Step ${index + 1} of ${ONBOARDING_STEP_COUNT}`}
            />

            <Touchable
              onPress={() => finish(false)}
              haptic="light"
              hitSlop={12}
              accessibilityLabel="Skip to my dashboard"
            >
              <Text variant="labelStrong" color="subtle">
                Skip
              </Text>
            </Touchable>
          </Row>

          <Companion message={step.say(draft)} hint={step.hint} mood={step.mood} />

          <Animated.View key={step.id} entering={FadeIn.duration(220)}>
            <StepAnswer
              step={step}
              draft={draft}
              saveAnswer={saveAnswer}
              onPick={(key, value) => {
                saveAnswer(key, value);
                advanceSoon();
              }}
              onComplete={advanceSoon}
              onSubmit={goNext}
            />
          </Animated.View>
        </Stack>
      </Screen>
    </KeyboardAvoidingView>
  );
}

function StepAnswer({ step, draft, saveAnswer, onPick, onComplete, onSubmit }) {
  switch (step.kind) {
    case StepKind.NAMES:
      return (
        <TextField
          label="Your first name"
          value={draft?.firstName ?? ''}
          onChangeText={(text) => saveAnswer('firstName', text)}
          placeholder="e.g. Sam"
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={onSubmit}
          autoFocus
        />
      );

    case StepKind.DATE:
      return (
        <DateAnswer
          value={draft?.weddingDate ?? null}
          dateType={draft?.dateType}
          onChange={({ date, dateType }) => {
            saveAnswer('weddingDate', date);
            saveAnswer('dateType', dateType);
          }}
          onComplete={onComplete}
        />
      );

    case StepKind.LOCATION:
      return (
        <LocationField
          label="City"
          value={draft?.city ?? ''}
          onChangeText={(text) => saveAnswer('city', text)}
          onLocate={(place) => {
            saveAnswer('city', place.label);
            saveAnswer('region', place.region);
            saveAnswer('country', place.country);
            onComplete();
          }}
          onSubmitEditing={onSubmit}
        />
      );

    case StepKind.CHOICE:
    default: {
      const options = typeof step.options === 'function' ? step.options(draft) : step.options;
      return (
        <ChoiceAnswer
          options={options}
          value={draft?.[step.key]}
          onChange={(next) => onPick(step.key, next)}
        />
      );
    }
  }
}
