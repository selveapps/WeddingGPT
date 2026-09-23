import React, { useMemo, useState } from 'react';

import {
  Stack,
  Row,
  Text,
  Chip,
  Button,
  BottomSheet,
  ListRow,
  SegmentedControl,
} from '@/design-system/components';
import { MONTH_NAMES_SHORT, fromISODate, toISODate, todayISO, addDays, addMonths, formatMediumDate } from '@/lib/date';

/**
 * A date input for forms: a tappable row that opens a picker sheet.
 *
 * React Native has no cross-platform date control that matches a design system,
 * and pulling in a native picker would give us two visual languages on the same
 * screen. Chips cost more vertical space in the sheet but read the same on both
 * platforms and on the web, and they let the quick options sit right next to
 * the precise ones - which is what people actually use for a due date.
 */

const QUICK_OPTIONS = [
  { label: 'Today', resolve: () => todayISO() },
  { label: 'Tomorrow', resolve: () => addDays(todayISO(), 1) },
  { label: 'Next week', resolve: () => addDays(todayISO(), 7) },
  { label: 'In 2 weeks', resolve: () => addDays(todayISO(), 14) },
  { label: 'In a month', resolve: () => addMonths(todayISO(), 1) },
  { label: 'In 3 months', resolve: () => addMonths(todayISO(), 3) },
];

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function DateField({
  label = 'Date',
  value,
  onChange,
  placeholder = 'No date set',
  /** Adds a "Clear" control to the sheet. */
  clearable = true,
  icon = 'calendar',
}) {
  const [open, setOpen] = useState(false);

  // Draft state so that cancelling the sheet leaves the real value untouched.
  const [draft, setDraft] = useState(value ?? null);

  const parsed = useMemo(() => fromISODate(draft), [draft]);
  const now = new Date();
  const year = parsed?.getFullYear() ?? now.getFullYear();
  const monthIndex = parsed?.getMonth() ?? now.getMonth();
  const day = parsed?.getDate() ?? null;

  const years = useMemo(() => {
    const base = now.getFullYear();
    return [base, base + 1, base + 2].map((y) => ({ value: y, label: String(y) }));
  }, [now]);

  const openSheet = () => {
    setDraft(value ?? null);
    setOpen(true);
  };

  const setPart = (part) => {
    const y = part.year ?? year;
    const m = part.monthIndex ?? monthIndex;
    const d = Math.min(part.day ?? day ?? 1, daysInMonth(y, m));
    setDraft(toISODate(new Date(y, m, d)));
  };

  return (
    <>
      <ListRow
        icon={icon}
        title={label}
        trailing={
          <Text variant="body" color={value ? 'default' : 'subtle'}>
            {value ? formatMediumDate(value) : placeholder}
          </Text>
        }
        onPress={openSheet}
        showChevron={false}
        accessibilityLabel={`${label}. ${value ? formatMediumDate(value) : placeholder}`}
      />

      <BottomSheet
        visible={open}
        onClose={() => setOpen(false)}
        title={label}
        subtitle={draft ? formatMediumDate(draft) : 'Nothing selected yet'}
        footer={
          <Stack gap="xs">
            <Button
              label="Set date"
              disabled={!draft}
              onPress={() => {
                onChange(draft);
                setOpen(false);
              }}
            />
            {clearable ? (
              <Button
                label="Clear"
                variant="ghost"
                onPress={() => {
                  onChange(null);
                  setOpen(false);
                }}
              />
            ) : null}
          </Stack>
        }
      >
        <Stack gap="lg">
          <Stack gap="xs">
            <Text variant="eyebrow" color="subtle">
              Quick picks
            </Text>
            <Row gap="xs" wrap align="flex-start">
              {QUICK_OPTIONS.map((option) => {
                const resolved = option.resolve();
                return (
                  <Chip
                    key={option.label}
                    label={option.label}
                    selected={draft === resolved}
                    onPress={() => setDraft(resolved)}
                  />
                );
              })}
            </Row>
          </Stack>

          <Stack gap="xs">
            <Text variant="eyebrow" color="subtle">
              Year
            </Text>
            <SegmentedControl
              options={years}
              value={year}
              onChange={(nextYear) => setPart({ year: nextYear })}
            />
          </Stack>

          <Stack gap="xs">
            <Text variant="eyebrow" color="subtle">
              Month
            </Text>
            <Row gap="xs" wrap align="flex-start">
              {MONTH_NAMES_SHORT.map((name, index) => (
                <Chip
                  key={name}
                  label={name}
                  size="sm"
                  selected={Boolean(parsed) && monthIndex === index}
                  onPress={() => setPart({ monthIndex: index })}
                />
              ))}
            </Row>
          </Stack>

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
                  onPress={() => setPart({ day: d })}
                />
              ))}
            </Row>
          </Stack>
        </Stack>
      </BottomSheet>
    </>
  );
}

export default DateField;
