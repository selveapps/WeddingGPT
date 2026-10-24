import { useMemo, useState } from 'react';
import { filterItems } from '../lib/extendedSelectors';
/** Additive hook — does not replace existing hooks. */
export function useExtendedAuthList(items = []) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const filtered = useMemo(() => filterItems(items, { query, status }), [items, query, status]);
  return { query, setQuery, status, setStatus, filtered };
}
