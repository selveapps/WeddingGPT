import { useCallback, useMemo } from 'react';

import { useWeddingStore, selectWedding } from '@/store/weddingStore';
import { createId } from '@/lib/id';

import { SAMPLE_TIMELINE } from '../lib/timelineConstants';
import { sortTimelineEvents } from '../lib/timelineHelpers';

export function useWeddingTimeline() {
  const wedding = useWeddingStore(selectWedding);
  const updateWedding = useWeddingStore((state) => state.updateWedding);

  const events = useMemo(
    () => sortTimelineEvents(Array.isArray(wedding?.dayOfTimeline) ? wedding.dayOfTimeline : []),
    [wedding?.dayOfTimeline]
  );

  const addEvent = useCallback(
    (values) => {
      if (!wedding) return null;
      const event = {
        id: createId('timeline'),
        title: values.title.trim(),
        time: values.time.trim(),
        owner: values.owner?.trim() ?? '',
        note: values.note?.trim() ?? '',
        completed: false,
        createdAt: new Date().toISOString(),
      };
      updateWedding({ dayOfTimeline: sortTimelineEvents([...events, event]) });
      return event;
    },
    [events, updateWedding, wedding]
  );

  const updateEvent = useCallback(
    (id, values) => {
      if (!wedding) return null;
      const next = events.map((event) =>
        event.id === id
          ? {
              ...event,
              title: values.title.trim(),
              time: values.time.trim(),
              owner: values.owner?.trim() ?? '',
              note: values.note?.trim() ?? '',
              updatedAt: new Date().toISOString(),
            }
          : event
      );
      const updatedEvent = next.find((event) => event.id === id) ?? null;
      if (!updatedEvent) return null;
      updateWedding({ dayOfTimeline: sortTimelineEvents(next) });
      return updatedEvent;
    },
    [events, updateWedding, wedding]
  );

  const toggleEvent = useCallback(
    (id) => {
      if (!wedding) return;
      updateWedding({
        dayOfTimeline: events.map((event) =>
          event.id === id ? { ...event, completed: !event.completed } : event
        ),
      });
    },
    [events, updateWedding, wedding]
  );

  const removeEvent = useCallback(
    (id) => {
      if (!wedding) return;
      updateWedding({ dayOfTimeline: events.filter((event) => event.id !== id) });
    },
    [events, updateWedding, wedding]
  );

  const addSampleTimeline = useCallback(() => {
    if (!wedding || events.length > 0) return;
    const createdAt = new Date().toISOString();
    const starterEvents = SAMPLE_TIMELINE.map((event) => ({
      ...event,
      id: createId('timeline'),
      owner: '',
      completed: false,
      createdAt,
    }));
    updateWedding({ dayOfTimeline: starterEvents });
  }, [events.length, updateWedding, wedding]);

  return {
    events,
    addEvent,
    updateEvent,
    toggleEvent,
    removeEvent,
    addSampleTimeline,
  };
}
