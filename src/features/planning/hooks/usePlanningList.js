import { useMemo, useState } from 'react';
import { filterItems } from '../lib/selectors';

export function usePlanningList(items = []) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const filtered = useMemo(() => filterItems(items, { query, status }), [items, query, status]);
  return { query, setQuery, status, setStatus, filtered };
}
