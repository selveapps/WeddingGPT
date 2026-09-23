import React, { useCallback, useEffect, useMemo } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

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
import { useTheme } from '@/design-system/theme';
import { Routes } from '@/navigation/routes';
import { useWeddingStore, selectDraft } from '@/store';
import { analytics, AnalyticsEvents } from '@/services/analytics';
import {
  StepKind,
  ONBOARDING_STEPS,
  ONBOARDING_STEP_COUNT,
  clampStepIndex,
  isStepAnswered,
} from '@/models';
import { ChoiceAnswer, MultiAnswer } from '@/features/onboarding/ChoiceAnswer';
import { DateAnswer } from '@/features/onboarding/DateAnswer';

/**
 * One onboarding question.
 *
 * Every step in the flow is this file: the question, its help text and its
 * options all come from `ONBOARDING_STEPS`, so the script lives in one place
 * and the eleven screens cannot drift apart (see `models/onboarding`).
 *
 * Answers are written to the store on every keystroke and every tap rather than
 * on Continue. PRD s.4.3 is explicit that closing the app mid-flow must lose
 * nothing, and "nothing" includes the half-typed answer on the current screen.
 */
export default function OnboardingStepScreen() {
  const router = useRouter();
  const { spacing } = useTheme();
  const params = useLocalSearchParams();

  const index = clampStepIndex(params.step);
  const step = ONBOARDING_STEPS[index];

  const draft = useWeddingStore(selectDraft);
  const saveAnswer = useWeddingStore((state) => state.saveAnswer);
  const setOnboardingStep = useWeddingStore((state) => state.setOnboardingStep);
  const completeOnboarding = useWeddingStore((state) => state.completeOnboarding);

  const value = draft?.[step.key];
  const isLast = index === ONBOARDING_STEP_COUNT - 1;
  const canContinue = isStepAnswered(step, value);

  // Record the resume point as soon as the step is shown, not when it is
  // answered - a couple who quits while reading question seven should come back
  // to question seven, not to six.
  useEffect(() => {
    setOnboardingStep(index);
  }, [index, setOnboardingStep]);

  // Steps with a sensible default pre-select it, so "Continue" is always a
  // valid move and the screen never reads as an interrogation.
  useEffect(() => {
    if (step.defaultValue !== undefined && draft?.[step.key] === undefined) {
      saveAnswer(step.key, step.defaultValue);
    }
  }, [step, draft, saveAnswer]);

  const goNext = useCallback(
    (skipped = false) => {
      analytics.track(
        skipped ? AnalyticsEvents.ONBOARDING_STEP_SKIPPED : AnalyticsEvents.ONBOARDING_STEP_COMPLETED,
        { step: step.id, index }
      );

      if (!isLast) {
        router.push(Routes.onboardingStep(index + 1));
        return;
      }

      // Build the real entities, then hand over to the plan screen, which
      // generates the checklist and budget from them.
      completeOnboarding();
      analytics.track(AnalyticsEvents.ONBOARDING_COMPLETED, {
        answered: Object.keys(draft ?? {}).length,
      });
      router.replace(Routes.plan);
    },
    [completeOnboarding, draft, index, isLast, router, step.id]
  );

  const answer = useMemo(() => {
    switch (step.kind) {
      case StepKind.TEXT:
        return (
          <TextField
            label={step.label}
            value={value ?? ''}
            onChangeText={(text) => saveAnswer(step.key, text)}
            placeholder={step.placeholder}
            autoCapitalize={step.autoCapitalize}
            autoCorrect={false}
            returnKeyType={isLast ? 'done' : 'next'}
            onSubmitEditing={() => canContinue && goNext()}
            autoFocus
          />
        );

      case StepKind.DATE:
        return (
          <DateAnswer
            value={value ?? null}
            dateType={draft?.dateType ?? null}
            onChange={({ date, dateType }) => {
              saveAnswer(step.key, date);
              saveAnswer('dateType', dateType);
            }}
          />
        );

      case StepKind.MULTI:
        return (
          <MultiAnswer
            options={step.options}
            value={value ?? []}
            onChange={(next) => saveAnswer(step.key, next)}
          />
        );

      case StepKind.CHOICE:
      default:
        return (
          <ChoiceAnswer
            options={step.options}
            value={value ?? null}
            onChange={(next) => saveAnswer(step.key, next)}
          />
        );
    }
  }, [step, value, draft, saveAnswer, canContinue, goNext, isLast]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen
        bottomInset={spacing.lg}
        footer={
          <Stack gap="xs">
            <Button
              label={isLast ? 'Build my plan' : 'Continue'}
              iconRight={isLast ? 'sparkle' : 'arrowRight'}
              disabled={!canContinue}
              onPress={() => goNext(false)}
            />
            {step.optional ? (
              <Button label="Skip for now" variant="ghost" onPress={() => goNext(true)} />
            ) : null}
          </Stack>
        }
      >
        <Stack gap="xl">
          {/* --- Progress and back ------------------------------------------ */}
          <Stack gap="sm">
            <Row gap="sm">
              <Touchable
                onPress={() => router.back()}
                accessibilityLabel="Back to the previous question"
                hitSlop={12}
              >
                <Icon name="chevronLeft" size="md" color="inkMuted" />
              </Touchable>

              <Text variant="caption" color="subtle" style={{ flex: 1 }}>
                Question {index + 1} of {ONBOARDING_STEP_COUNT}
              </Text>
            </Row>

            <ProgressBar
              value={(index + 1) / ONBOARDING_STEP_COUNT}
              height={4}
              accessibilityLabel={`Step ${index + 1} of ${ONBOARDING_STEP_COUNT}`}
            />
          </Stack>

          {/* --- The question ----------------------------------------------- */}
          <Stack gap="sm">
            {step.eyebrow ? (
              <Text variant="eyebrow" color="accent">
                {step.eyebrow}
              </Text>
            ) : null}

            <Text variant="h1" heading>
              {step.question}
            </Text>

            {step.help ? (
              <Text variant="body" color="muted">
                {step.help}
              </Text>
            ) : null}
          </Stack>

          {answer}
        </Stack>
      </Screen>
    </KeyboardAvoidingView>
  );
}
