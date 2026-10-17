import React, { useMemo } from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Stack, Row, Text, Chip, SegmentedControl } from '@/design-system/components';
import { DateType, DATE_TYPE_OPTIONS, SEASON_OPTIONS } from '@/models';
import { MONTH_NAMES_SHORT, fromISODate, toISODate } from '@/lib/date';

import { ChoiceAnswer } from './ChoiceAnswer';

/**
 * The date question (PRD s.4.2, item 3).
 *
 * The hard part of this screen is that most couples do not have a date. Asking
 * for one with a calendar picker forces a precision they cannot give, and the
 * usual workaround - a "skip" link - throws away the rough answer they *do*
 * have. So precision is the first question, and the controls that follow match
 * whatever precision was chosen.
 *
 * Approximate answers are stored as a real ISO date in the middle of the chosen
 * month, with `dateType` recording how much to trust it. That keeps one date
 * field in the model rather than three, while `hasExactDate` still stops the UI
 * from showing a day-level countdown off a guess.
 */

const MID_MONTH = 15;

/** Four years is the full realistic range; beyond that nobody is planning yet. */
function yearOptions(from = new Date()) {
  const thisYear = from.getFullYear();
  return [0, 1, 2, 3].map((offset) => ({
    value: thisYear + offset,
    label: String(thisYear + offset),
  }));
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/**
 * `onComplete` fires when the answer needs nothing more - today that is only
 * "Not decided yet" - so the journey can move on without a Continue tap.
 */
export function DateAnswer({ value, dateType, onChange, onComplete }) {
  const years = useMemo(() => yearOptions(), []);

  const parsed = useMemo(() => fromISODate(value), [value]);
  const year = parsed?.getFullYear() ?? years[0].value;
  const monthIndex = parsed?.getMonth() ?? null;
  const day = parsed?.getDate() ?? null;

  /**
   * Rebuild the stored date from whichever parts are now known.
   * Clamps the day so switching from 31 March to February cannot produce the
   * 3rd of March - a bug that is invisible until someone's countdown is wrong.
   */
  const emit = (next) => {
    const nextType = next.dateType ?? dateType ?? DateType.UNDECIDED;

    if (nextType === DateType.UNDECIDED) {
      onChange({ date: null, dateType: DateType.UNDECIDED });
      onComplete?.();
      return;
    }

    const y = next.year ?? year;
    const m = next.monthIndex ?? monthIndex;

    if (m === null || m === undefined) {
      onChange({ date: null, dateType: nextType });
      return;
    }

    const wantedDay = nextType === DateType.EXACT ? (next.day ?? day ?? 1) : MID_MONTH;
    const d = Math.min(wantedDay, daysInMonth(y, m));

    onChange({ date: toISODate(new Date(y, m, d)), dateType: nextType });
  };

  const showMonths = dateType === DateType.EXACT || dateType === DateType.MONTH;
  const showDays = dateType === DateType.EXACT && monthIndex !== null;
  const showSeasons = dateType === DateType.SEASON;
  const showYear = dateType && dateType !== DateType.UNDECIDED;

  return (
    <Stack gap="lg">
      <ChoiceAnswer
        options={DATE_TYPE_OPTIONS}
        value={dateType ?? undefined}
        onChange={(nextType) => emit({ dateType: nextType })}
      />

      {showYear ? (
        <Animated.View entering={FadeIn.duration(240)}>
          <Stack gap="xs">
            <Text variant="eyebrow" color="subtle">
              Year
            </Text>
            <SegmentedControl
              options={years}
              value={year}
              onChange={(nextYear) => emit({ year: nextYear })}
            />
          </Stack>
        </Animated.View>
      ) : null}

      {showSeasons ? (
        <Stack gap="xs">
          <Text variant="eyebrow" color="subtle">
            Season
          </Text>
          <ChoiceAnswer
            options={SEASON_OPTIONS}
            value={monthIndex === null ? undefined : monthIndex}
            onChange={(seasonMonth) => emit({ monthIndex: seasonMonth })}
          />
        </Stack>
      ) : null}

      {showMonths ? (
        <Stack gap="xs">
          <Text variant="eyebrow" color="subtle">
            Month
          </Text>
          <Row gap="xs" wrap align="flex-start">
            {MONTH_NAMES_SHORT.map((name, index) => (
              <Chip
                key={name}
                label={name}
                selected={monthIndex === index}
                onPress={() => emit({ monthIndex: index })}
              />
            ))}
          </Row>
        </Stack>
      ) : null}

      {showDays ? (
        <Stack gap="xs">
          <Text variant="eyebrow" color="subtle">
            Day
          </Text>
          <Row gap="xs" wrap align="flex-start">
            {Array.from({ length: daysInMonth(year, monthIndex) }, (_, i) => i + 1).map((d) => (
              <Chip
                key={d}
                label={String(d)}
                size="sm"
                selected={day === d}
                onPress={() => emit({ day: d })}
              />
            ))}
          </Row>
        </Stack>
      ) : null}
    </Stack>
  );
}

export default DateAnswer;
