import React from 'react';

import { Badge, ListRow, useToast } from '@/design-system/components';
import { openLocalSearch } from './openLocalSearch';

const URGENCY_TONE = {
  now: 'brand',
  soon: 'accent',
  later: 'neutral',
  booked: 'success',
};

/**
 * One local recommendation: the vendor category, why it matters right now,
 * and a badge for how pressing it is. Tapping opens a map search near `city`.
 */
export function LocalPickRow({ pick, city, source = 'local' }) {
  const toast = useToast();

  const open = async () => {
    const ok = await openLocalSearch(pick.key, city, source);
    if (!ok) toast.error('Could not open maps. Try again in a moment.');
  };

  return (
    <ListRow
      icon={pick.icon}
      title={pick.name}
      subtitle={pick.reason}
      trailing={<Badge label={pick.urgencyLabel} tone={URGENCY_TONE[pick.urgency] ?? 'neutral'} />}
      onPress={open}
      accessibilityLabel={`${pick.name}, ${pick.urgencyLabel}. ${pick.reason}`}
      accessibilityHint={`Searches maps near ${city}`}
    />
  );
}

export default LocalPickRow;
