import { useCallback, useEffect, useState } from 'react';
import { storage } from '@/services/storage';

/** Small persistence hook for feature-owned JSON collections. */
export function usePersistentList(storageKey, initialValue = []) {
  const [items, setItems] = useState(initialValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    storage
      .get(storageKey)
      .then((value) => {
        if (active && Array.isArray(value)) setItems(value);
      })
      .catch((error) => {
        if (__DEV__) console.warn(`[storage] Could not read ${storageKey}`, error);
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [storageKey]);

  useEffect(() => {
    if (!loaded) return;
    storage.set(storageKey, items).catch((error) => {
      if (__DEV__) console.warn(`[storage] Could not save ${storageKey}`, error);
    });
  }, [items, loaded, storageKey]);

  const add = useCallback((item) => setItems((current) => [...current, item]), []);
  const update = useCallback((id, patch) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);
  const remove = useCallback((id) => setItems((current) => current.filter((item) => item.id !== id)), []);

  return { items, setItems, add, update, remove, loaded };
}

export function createId(prefix = 'item') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
