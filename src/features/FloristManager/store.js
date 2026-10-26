/**
 * FloristManager Store - Zustand store for FloristManager
 * WeddingGPT Extension Module - DO NOT modify existing app files
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FloristManagerAPI } from './services/api';
import { validateFloristManagerItem } from './validators';

const useFloristManagerStore = create(
  persist(
    (set, get) => ({
      items: [],
      selectedId: null,
      loading: false,
      error: null,
      filters: { search: '', status: 'all', sortBy: 'createdAt', sortOrder: 'desc' },
      pagination: { page: 1, pageSize: 20, total: 0 },
      stats: { total: 0, active: 0, completed: 0, pending: 0 },

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      setFilters: (filters) => set((s) => ({ filters: { ...s.filters, ...filters }, pagination: { ...s.pagination, page: 1 } })),
      setPagination: (p) => set((s) => ({ pagination: { ...s.pagination, ...p } })),
      selectItem: (id) => set({ selectedId: id }),
      clearSelection: () => set({ selectedId: null }),

      fetchItems: async (params = {}) => {
        set({ loading: true, error: null });
        try {
          const state = get();
          const response = await FloristManagerAPI.list({ ...state.filters, page: state.pagination.page, pageSize: state.pagination.pageSize, ...params });
          set({ items: response.data || [], pagination: { ...state.pagination, total: response.total || 0 }, stats: response.stats || state.stats, loading: false });
          return response;
        } catch (err) {
          set({ error: err.message || 'Failed to fetch', loading: false });
          throw err;
        }
      },

      addItem: async (payload) => {
        const validation = validateFloristManagerItem(payload);
        if (!validation.valid) { set({ error: validation.errors.join(', ') }); return null; }
        set({ loading: true, error: null });
        try {
          const newItem = await FloristManagerAPI.create(payload);
          set((s) => ({ items: [newItem, ...s.items], stats: { ...s.stats, total: s.stats.total + 1, pending: s.stats.pending + 1 }, loading: false }));
          return newItem;
        } catch (err) { set({ error: err.message || 'Failed to add', loading: false }); throw err; }
      },

      updateItem: async (id, payload) => {
        const validation = validateFloristManagerItem(payload, true);
        if (!validation.valid) { set({ error: validation.errors.join(', ') }); return null; }
        set({ loading: true, error: null });
        try {
          const updated = await FloristManagerAPI.update(id, payload);
          set((s) => ({ items: s.items.map((i) => (i.id === id ? updated : i)), loading: false }));
          return updated;
        } catch (err) { set({ error: err.message || 'Failed to update', loading: false }); throw err; }
      },

      deleteItem: async (id) => {
        set({ loading: true, error: null });
        try {
          await FloristManagerAPI.remove(id);
          set((s) => ({ items: s.items.filter((i) => i.id !== id), selectedId: s.selectedId === id ? null : s.selectedId, stats: { ...s.stats, total: Math.max(0, s.stats.total - 1) }, loading: false }));
          return true;
        } catch (err) { set({ error: err.message || 'Failed to delete', loading: false }); throw err; }
      },

      bulkUpdate: async (ids, payload) => {
        set({ loading: true, error: null });
        try {
          const results = await FloristManagerAPI.bulkUpdate(ids, payload);
          set((s) => ({ items: s.items.map((item) => results.find((r) => r.id === item.id) || item), loading: false }));
          return results;
        } catch (err) { set({ error: err.message || 'Bulk update failed', loading: false }); throw err; }
      },

      getSelected: () => { const { items, selectedId } = get(); return items.find((i) => i.id === selectedId) || null; },

      getFiltered: () => {
        const { items, filters } = get();
        let result = [...items];
        if (filters.search) {
          const q = filters.search.toLowerCase();
          result = result.filter((i) => (i.name || '').toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q));
        }
        if (filters.status && filters.status !== 'all') result = result.filter((i) => i.status === filters.status);
        const sortKey = filters.sortBy || 'createdAt';
        const order = filters.sortOrder === 'asc' ? 1 : -1;
        result.sort((a, b) => { const av = a[sortKey] ?? ''; const bv = b[sortKey] ?? ''; return av < bv ? -1 * order : av > bv ? 1 * order : 0; });
        return result;
      },

      recalculateStats: () => {
        const items = get().items;
        set({ stats: { total: items.length, active: items.filter((i) => i.status === 'active').length, completed: items.filter((i) => i.status === 'completed').length, pending: items.filter((i) => i.status === 'pending').length } });
      },

      reset: () => set({ items: [], selectedId: null, loading: false, error: null, filters: { search: '', status: 'all', sortBy: 'createdAt', sortOrder: 'desc' }, pagination: { page: 1, pageSize: 20, total: 0 }, stats: { total: 0, active: 0, completed: 0, pending: 0 } }),
    }),
    { name: 'floristmanager-storage', storage: createJSONStorage(() => AsyncStorage), partialize: (s) => ({ items: s.items, filters: s.filters, stats: s.stats }) }
  )
);

export default useFloristManagerStore;
