import React, { useMemo, useState } from 'react';

import {
  Button,
  Card,
  ConfirmSheet,
  EmptyState,
  SectionHeader,
  Stack,
  Text,
  TextField,
  useToast,
} from '@/design-system/components';
import { DateField } from '@/features/shared/DateField';
import { formatMediumDate, todayISO } from '@/lib/date';

function sortMeetings(meetings) {
  const today = todayISO();
  return [...meetings].sort((left, right) => {
    const leftUpcoming = left.date >= today;
    const rightUpcoming = right.date >= today;
    if (leftUpcoming !== rightUpcoming) return leftUpcoming ? -1 : 1;
    return leftUpcoming ? left.date.localeCompare(right.date) : right.date.localeCompare(left.date);
  });
}

export function VendorMeetingHistory({ meetings = [], onAdd, onRemove }) {
  const toast = useToast();
  const sortedMeetings = useMemo(() => sortMeetings(meetings ?? []), [meetings]);
  const [date, setDate] = useState(null);
  const [notes, setNotes] = useState('');
  const [removeTarget, setRemoveTarget] = useState(null);

  const addMeeting = () => {
    if (!date) {
      toast.error('Choose a meeting date first.');
      return;
    }
    if (!onAdd?.({ date, notes })) {
      toast.error('Could not save this meeting.');
      return;
    }
    setDate(null);
    setNotes('');
    toast.success('Meeting added');
  };

  const removeMeeting = () => {
    if (!removeTarget || !onRemove?.(removeTarget.id)) {
      toast.error('Could not remove this meeting.');
      return;
    }
    setRemoveTarget(null);
    toast.success('Meeting removed');
  };

  return (
    <Stack gap="sm" testID="vendor-meeting-history">
      <SectionHeader
        eyebrow="Appointments"
        title="Meeting history"
        subtitle="Keep upcoming tastings, calls and consultations with this vendor."
      />

      {sortedMeetings.length ? (
        <Stack gap="xs">
          {sortedMeetings.map((meeting) => (
            <Card key={meeting.id} testID={`vendor-meeting-${meeting.id}`}>
              <Stack gap="sm">
                <Text variant="bodyStrong">{formatMediumDate(meeting.date)}</Text>
                {meeting.notes ? (
                  <Text variant="bodySm" color="muted">
                    {meeting.notes}
                  </Text>
                ) : null}
                <Button
                  label="Remove meeting"
                  variant="ghost"
                  size="sm"
                  iconLeft="trash"
                  onPress={() => setRemoveTarget(meeting)}
                />
              </Stack>
            </Card>
          ))}
        </Stack>
      ) : (
        <EmptyState
          icon="calendar"
          compact
          title="No meetings recorded"
          message="Add a tasting, call or consultation to keep the vendor conversation in one place."
        />
      )}

      <Card tone="muted">
        <Stack gap="sm">
          <Text variant="bodyStrong">Add a meeting</Text>
          <DateField label="Meeting date" value={date} onChange={setDate} placeholder="Choose a date" />
          <TextField
            label="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            placeholder="Questions to ask, people attending, or follow-up"
            multiline
            numberOfLines={3}
            maxLength={300}
          />
          <Button label="Save meeting" variant="secondary" iconLeft="calendar" onPress={addMeeting} />
        </Stack>
      </Card>

      <ConfirmSheet
        visible={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        onConfirm={removeMeeting}
        title="Remove this meeting?"
        message={
          removeTarget
            ? `${formatMediumDate(removeTarget.date)} will be removed from this vendor's history.`
            : ''
        }
        confirmLabel="Remove meeting"
        cancelLabel="Keep meeting"
        destructive
        icon="trash"
      />
    </Stack>
  );
}

export default VendorMeetingHistory;
