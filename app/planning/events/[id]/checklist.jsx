import React from 'react';
import { useLocalSearchParams } from 'expo-router';

import { EventChecklistScreen } from '@/features/events/EventChecklistScreen';

export default function EventChecklistRoute() {
  const { id } = useLocalSearchParams();
  return <EventChecklistScreen key={String(id)} eventId={String(id)} />;
}
