import React from 'react';
import { useLocalSearchParams } from 'expo-router';

import { EventFormScreen } from '@/features/events/EventFormScreen';

export default function EventScreen() {
  const { id } = useLocalSearchParams();
  // Keyed so moving between events starts each form from its own values.
  return <EventFormScreen key={String(id)} eventId={String(id)} />;
}
