import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';

import { Screen, Stack, Text, Button, Icon, Row } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { Routes } from '@/navigation/routes';
import { useWeddingStore, selectOnboardingStep, selectDraft, selectOnboardingStatus } from '@/store';
import { analytics, AnalyticsEvents } from '@/services/analytics';
import { OnboardingStatus, ONBOARDING_STEP_COUNT } from '@/models';

/**
 * The welcome screen, and the resume point.
 *
 * PRD s.4.3 requires that leaving mid-flow loses nothing and resumes at the
 * right step. The persisted `onboardingStep` is the resume marker, so a couple
 * who closed the app on question seven is offered question seven rather than
 * being marched back through the six they already answered.
 */
export default function OnboardingWelcome() {
  const router = useRouter();
  const { spacing } = useTheme();

  const startOnboarding = useWeddingStore((state) => state.startOnboarding);
  const status = useWeddingStore(selectOnboardingStatus);
  const savedStep = useWeddingStore(selectOnboardingStep);
  const draft = useWeddingStore(selectDraft);

  const answered = Object.keys(draft ?? {}).length;
  const resuming = status === OnboardingStatus.IN_PROGRESS && answered > 0;

  useEffect(() => {
    analytics.track(
      resuming ? AnalyticsEvents.ONBOARDING_RESUMED : AnalyticsEvents.ONBOARDING_STARTED,
      { answered, step: savedStep }
    );
    // Deliberately once per mount: this is the "did they come back?" signal, and
    // re-firing it as the draft changes would make it meaningless.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const begin = (step) => {
    startOnboarding();
    router.push(Routes.onboardingStep(step));
  };

  return (
    <Screen
      bottomInset={spacing.xl}
      footer={
        <Stack gap="xs">
          <Button
            label={resuming ? 'Pick up where you left off' : 'Get started'}
            iconRight="arrowRight"
            onPress={() => begin(resuming ? savedStep : 0)}
          />
          {resuming ? (
            <Button label="Start again" variant="ghost" onPress={() => begin(0)} />
          ) : null}
        </Stack>
      }
    >
      <Stack gap="xxl" style={{ flex: 1, justifyContent: 'center' }}>
        <Stack gap="md">
          <Icon name="rings" size={56} color="brand" />

          <Stack gap="sm">
            <Text variant="displaySm" heading>
              {resuming ? 'Welcome back' : 'Let us start with you'}
            </Text>
            <Text variant="bodyLg" color="muted">
              {resuming
                ? `Your answers are saved. ${ONBOARDING_STEP_COUNT - savedStep} questions to go, and then your plan.`
                : `A handful of questions - no forms, no account yet. At the end you get a plan built around your date, your budget and where you actually are.`}
            </Text>
          </Stack>
        </Stack>

        <Stack gap="sm">
          {[
            { icon: 'calendar', text: 'A checklist dated from your wedding day' },
            { icon: 'budget', text: 'A starting budget split you can change' },
            { icon: 'sparkle', text: 'One clear next step, every time you open it' },
          ].map((item) => (
            <Row key={item.text} gap="sm">
              <Icon name={item.icon} size="md" color="brand" />
              <Text variant="body" color="muted" style={{ flex: 1 }}>
                {item.text}
              </Text>
            </Row>
          ))}
        </Stack>
      </Stack>
    </Screen>
  );
}
