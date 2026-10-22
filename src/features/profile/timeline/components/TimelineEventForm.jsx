import React from 'react';
import { View } from 'react-native';

import { Card, Chip, Icon, Row, Stack, Text, TextField } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';

import { TIMELINE_COPY } from '../lib/timelineConstants';

const SUGGESTED_TIMES = ['09:00', '12:00', '15:00', '18:00'];

export function TimelineEventForm({ values, errors, onChange }) {
  const { colors, radii } = useTheme();
  const set = (key) => (value) => onChange({ ...values, [key]: value });

  return (
    <Stack gap="lg" testID="timeline-event-form">
      <Card tone="brand" padding="md">
        <Row gap="sm" align="center">
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: radii.md,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.surface,
            }}
          >
            <Icon name="sparkle" size="md" color="brand" />
          </View>
          <Stack gap="xxs" style={{ flex: 1 }}>
            <Text variant="labelStrong" color="brandSoftInk">
              Plan one moment at a time
            </Text>
            <Text variant="caption" color="brandSoftInk">
              Add a clear name and start time. You can fill in the details later.
            </Text>
          </Stack>
        </Row>
      </Card>

      <Stack gap="md">
        <TextField
          label={TIMELINE_COPY.titleLabel}
          value={values.title}
          onChangeText={set('title')}
          placeholder={TIMELINE_COPY.titlePlaceholder}
          error={errors.title}
          maxLength={70}
          autoCapitalize="sentences"
          returnKeyType="next"
          testID="timeline-event-title"
        />

        <Card padding="md">
          <Stack gap="sm">
            <Row gap="sm" align="center">
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: radii.sm,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.brandSoft,
                }}
              >
                <Icon name="clock" size="sm" color="brandSoftInk" />
              </View>
              <Stack gap="xxs" style={{ flex: 1 }}>
                <Text variant="labelStrong">When does it happen?</Text>
                <Text variant="caption" color="subtle">
                  Choose a suggested time or enter your own.
                </Text>
              </Stack>
            </Row>
            <TextField
              label={TIMELINE_COPY.timeLabel}
              value={values.time}
              onChangeText={set('time')}
              placeholder={TIMELINE_COPY.timePlaceholder}
              helper="Enter time in 24-hour format."
              error={errors.time}
              maxLength={5}
              keyboardType="numbers-and-punctuation"
              testID="timeline-event-time"
            />
            <Row gap="xs" wrap>
              {SUGGESTED_TIMES.map((time) => (
                <Chip
                  key={time}
                  label={time}
                  icon="clock"
                  selected={values.time === time}
                  onPress={() => set('time')(time)}
                  size="sm"
                  testID={`timeline-time-${time.replace(':', '')}`}
                />
              ))}
            </Row>
          </Stack>
        </Card>
      </Stack>

      <Card tone="sunken" padding="md">
        <Stack gap="md">
          <Stack gap="xxs">
            <Text variant="labelStrong">Helpful details</Text>
            <Text variant="caption" color="subtle">
              Both fields are optional - add them whenever you are ready.
            </Text>
          </Stack>
          <TextField
            label={TIMELINE_COPY.ownerLabel}
            value={values.owner}
            onChangeText={set('owner')}
            placeholder={TIMELINE_COPY.ownerPlaceholder}
            error={errors.owner}
            maxLength={70}
            autoCapitalize="words"
          />
          <TextField
            label={TIMELINE_COPY.noteLabel}
            value={values.note}
            onChangeText={set('note')}
            placeholder={TIMELINE_COPY.notePlaceholder}
            error={errors.note}
            maxLength={220}
            multiline
            numberOfLines={3}
          />
        </Stack>
      </Card>
    </Stack>
  );
}
