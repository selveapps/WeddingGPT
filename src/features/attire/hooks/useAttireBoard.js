import { useMemo, useState, useCallback } from 'react';
import { useAttireStore } from '../../../store/attireStore';
import { filterItems } from '../lib/attireSelectors';

export function useAttireBoard() {
  const items = useAttireStore((s) => s.listItems());
  const stats = useAttireStore((s) => s.getStats());
  const nextFitting = useAttireStore((s) => s.nextFitting());
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [rentalOnly, setRentalOnly] = useState(false);
  const [needsFitting, setNeedsFitting] = useState(false);

  const filtered = useMemo(
    () => filterItems(items, { query, role, status, rentalOnly, needsFitting }),
    [items, query, role, status, rentalOnly, needsFitting]
  );

  const clearFilters = useCallback(() => {
    setQuery('');
    setRole('all');
    setStatus('all');
    setRentalOnly(false);
    setNeedsFitting(false);
  }, []);

  return {
    items, filtered, stats, nextFitting,
    query, setQuery, role, setRole, status, setStatus,
    rentalOnly, setRentalOnly, needsFitting, setNeedsFitting, clearFilters,
  };
}
