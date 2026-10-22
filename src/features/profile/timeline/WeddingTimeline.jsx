import React, { useMemo, useState } from 'react';

import {
  BottomSheet,
  Button,
  Card,
  ConfirmSheet,
  EmptyState,
  Row,
  SectionHeader,
  Stack,
  Text,
  useToast,
} from '@/design-system/components';

import { TimelineEventForm, TimelineEventRow } from './components';
import { useWeddingTimeline } from './hooks';
import { EMPTY_TIMELINE_EVENT, TIMELINE_COPY } from './lib/timelineConstants';
import { summariseTimeline, validateTimelineEvent } from './lib/timelineHelpers';

export function WeddingTimeline() {
  const toast = useToast();
  const { events, addEvent, updateEvent, toggleEvent, removeEvent, addSampleTimeline } =
    useWeddingTimeline();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [values, setValues] = useState(EMPTY_TIMELINE_EVENT);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [removingEvent, setRemovingEvent] = useState(null);

  const summary = useMemo(() => summariseTimeline(events), [events]);
  const progressText =
    summary.total === 0
      ? TIMELINE_COPY.noEvents
      : `${TIMELINE_COPY.eventCount(summary.total)} - ${TIMELINE_COPY.completedCount(summary.completed)}`;

  const openNewEvent = () => {
    setValues(EMPTY_TIMELINE_EVENT);
    setErrors({});
    setEditingId(null);
    setSheetOpen(true);
  };

  const openEditEvent = (event) => {
    setValues({
      title: event.title,
      time: event.time,
      owner: event.owner ?? '',
      note: event.note ?? '',
    });
    setErrors({});
    setEditingId(event.id);
    setSheetOpen(true);
  };

  const saveEvent = () => {
    const result = validateTimelineEvent(values);
    setErrors(result.errors);
    if (!result.isValid) return;

    const saved = editingId ? updateEvent(editingId, values) : addEvent(values);
    if (!saved) {
      toast.error(TIMELINE_COPY.saveError);
      return;
    }
    setSheetOpen(false);
    toast.success(editingId ? 'Timeline moment updated.' : 'Timeline moment added.');
  };

  const confirmRemove = () => {
    if (!removingEvent) return;
    removeEvent(removingEvent.id);
    setRemovingEvent(null);
    toast.success('Timeline moment removed.');
  };

  return (
    <Stack gap="sm" testID="wedding-day-timeline">
      <SectionHeader
        eyebrow={TIMELINE_COPY.eyebrow}
        title={TIMELINE_COPY.title}
        subtitle={TIMELINE_COPY.subtitle}
      />
      <Card>
        <Stack gap="md">
          <Row justify="space-between" wrap gap="sm">
            <Stack gap="xxs" style={{ flex: 1 }}>
              <Text variant="label" color="muted">
                {TIMELINE_COPY.timelineLabel}
              </Text>
              <Text variant="bodySm" color="subtle">
                {progressText}
              </Text>
            </Stack>
            <Button
              label={TIMELINE_COPY.addEvent}
              size="sm"
              variant="soft"
              iconLeft="plus"
              onPress={openNewEvent}
              testID="timeline-add-event"
            />
          </Row>

          {events.length ? (
            <Stack gap="none">
              {events.map((event) => (
                <TimelineEventRow
                  key={event.id}
                  event={event}
                  onToggle={() => toggleEvent(event.id)}
                  onEdit={() => openEditEvent(event)}
                  onRemove={() => setRemovingEvent(event)}
                />
              ))}
            </Stack>
          ) : (
            <Stack gap="sm">
              <EmptyState
                icon="clock"
                compact
                title={TIMELINE_COPY.emptyTitle}
                message={TIMELINE_COPY.emptyMessage}
              />
              <Button
                label={TIMELINE_COPY.samplePlan}
                variant="secondary"
                iconLeft="sparkle"
                onPress={addSampleTimeline}
                testID="timeline-add-sample"
              />
            </Stack>
          )}
        </Stack>
      </Card>

      <BottomSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editingId ? TIMELINE_COPY.editEvent : TIMELINE_COPY.newEvent}
        subtitle="Add the time and details your wedding team will need."
        footer={
          <Row gap="sm">
            <Button
              label="Cancel"
              variant="secondary"
              onPress={() => setSheetOpen(false)}
              style={{ flex: 1 }}
            />
            <Button
              label={TIMELINE_COPY.saveEvent}
              onPress={saveEvent}
              style={{ flex: 1 }}
              testID="timeline-save-event"
            />
          </Row>
        }
      >
        <TimelineEventForm values={values} errors={errors} onChange={setValues} />
      </BottomSheet>

      <ConfirmSheet
        visible={Boolean(removingEvent)}
        onClose={() => setRemovingEvent(null)}
        onConfirm={confirmRemove}
        title={TIMELINE_COPY.removeTitle}
        message={TIMELINE_COPY.removeMessage}
        confirmLabel={TIMELINE_COPY.removeEvent}
        cancelLabel="Keep moment"
        destructive
        icon="trash"
      />
    </Stack>
  );
}

export default WeddingTimeline;
