import React from 'react';
import { useLocalSearchParams } from 'expo-router';

import { EventPlanScreen } from '@/features/events/EventPlanScreen';

export default function EventPlanRoute() {
  const { event } = useLocalSearchParams();
  return <EventPlanScreen initialEventId={event ? String(event) : null} />;
}
