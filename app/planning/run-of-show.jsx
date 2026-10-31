import React from 'react';
import { useLocalSearchParams } from 'expo-router';

import { RunOfShowScreen } from '@/features/runOfShow/RunOfShowScreen';

export default function RunOfShowRoute() {
  const { event } = useLocalSearchParams();
  return <RunOfShowScreen initialEventId={event ? String(event) : null} />;
}
