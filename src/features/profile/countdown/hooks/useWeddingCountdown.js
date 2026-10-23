import { useMemo } from 'react';

import { useWeddingStore, selectWedding } from '@/store/weddingStore';
import { getCountdownBreakdown, getWeddingCountdown, getWeddingDateLabel } from '../lib/countdownHelpers';

export function useWeddingCountdown(now = new Date()) {
  const wedding = useWeddingStore(selectWedding);
  return useMemo(() => {
    const date = wedding?.date ?? null;
    return {
      date,
      countdown: getWeddingCountdown(date, now),
      breakdown: getCountdownBreakdown(date, now),
      dateLabel: getWeddingDateLabel(date),
    };
  }, [now, wedding?.date]);
}

export default useWeddingCountdown;
