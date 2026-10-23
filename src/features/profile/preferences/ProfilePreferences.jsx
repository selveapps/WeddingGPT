import React from 'react';

import { Card, SectionHeader, Stack, Text } from '@/design-system/components';
import { PreferenceChoice } from './components/PreferenceChoice';
import { useProfilePreferences } from './hooks/useProfilePreferences';
import { PACE_OPTIONS, SUPPORT_OPTIONS, WEEK_DAYS } from './lib/preferenceConstants';
import { formatQuietHours } from './lib/preferenceHelpers';

const DAY_OPTIONS = WEEK_DAYS.map((day) => ({ value: day, label: day }));
const QUIET_HOUR_OPTIONS = ['20:00', '21:00', '22:00', '23:00'].map((time) => ({
  value: time,
  label: formatQuietHours(time),
}));

export function ProfilePreferences() {
  const { preferences, setPreference, hasWorkspace } = useProfilePreferences();

  return (
    <Stack gap="sm" testID="profile-preferences">
      <SectionHeader
        eyebrow="Make it yours"
        title="Planning preferences"
        subtitle="Set a planning rhythm and the kind of support that feels right."
      />
      <Card>
        <Stack gap="lg">
          <PreferenceChoice
            label="Planning pace"
            description="This guides how suggestions are framed."
            options={PACE_OPTIONS}
            value={preferences.planningPace}
            onChange={(value) => setPreference('planningPace', value)}
            testID="profile-pace"
          />
          <PreferenceChoice
            label="Assistant style"
            options={SUPPORT_OPTIONS}
            value={preferences.supportStyle}
            onChange={(value) => setPreference('supportStyle', value)}
            testID="profile-support"
          />
          <PreferenceChoice
            label="Weekly planning day"
            options={DAY_OPTIONS}
            value={preferences.weeklyPlanningDay}
            onChange={(value) => setPreference('weeklyPlanningDay', value)}
            testID="profile-planning-day"
          />
          <PreferenceChoice
            label="Quiet hours begin"
            description="A preference for planning prompts; it does not change notification permissions."
            options={QUIET_HOUR_OPTIONS}
            value={preferences.quietHoursStart}
            onChange={(value) => setPreference('quietHoursStart', value)}
            testID="profile-quiet-hours"
          />
        </Stack>
      </Card>
      {!hasWorkspace ? (
        <Text variant="caption" color="muted">
          Create a wedding workspace to save preferences.
        </Text>
      ) : null}
    </Stack>
  );
}

export default ProfilePreferences;
