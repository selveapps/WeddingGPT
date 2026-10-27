/** GlowStickExitPlan store */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GlowStickExitPlanAPI } from './api';
import { validateItem } from './validators';
const useGlowStickExitPlanStore = create(persist((set, get) => ({
  items: [], selectedId: null, loading: false, error: null,
  filters: { search: '', status: 'all', sortBy: 'createdAt', sortOrder: 'desc' },
  stats: { total: 0, active: 0, completed: 0, pending: 0 },
  setLoading: (v) => set({ loading: v }), setError: (e) => set({ error: e }), clearError: () => set({ error: null }),
  setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
  selectItem: (id) => set({ selectedId: id }), clearSelection: () => set({ selectedId: null }),
  fetchItems: async (p = {}) => { set({ loading: true, error: null }); try { const st = get(); const res = await GlowStickExitPlanAPI.list({ ...st.filters, ...p }); set({ items: res.data || [], stats: res.stats || st.stats, loading: false }); return res; } catch (e) { set({ error: e.message, loading: false }); throw e; } },
  addItem: async (payload) => { const v = validateItem(payload); if (!v.valid) { set({ error: v.errors.join(', ') }); return null; } set({ loading: true }); try { const item = await GlowStickExitPlanAPI.create(payload); set((s) => ({ items: [item, ...s.items], stats: { ...s.stats, total: s.stats.total + 1 }, loading: false })); return item; } catch (e) { set({ error: e.message, loading: false }); throw e; } },
  updateItem: async (id, payload) => { set({ loading: true }); try { const u = await GlowStickExitPlanAPI.update(id, payload); set((s) => ({ items: s.items.map((i) => i.id === id ? u : i), loading: false })); return u; } catch (e) { set({ error: e.message, loading: false }); throw e; } },
  deleteItem: async (id) => { set({ loading: true }); try { await GlowStickExitPlanAPI.remove(id); set((s) => ({ items: s.items.filter((i) => i.id !== id), selectedId: s.selectedId === id ? null : s.selectedId, loading: false })); return true; } catch (e) { set({ error: e.message, loading: false }); throw e; } },
  bulkUpdate: async (ids, payload) => { set({ loading: true }); try { const r = await GlowStickExitPlanAPI.bulkUpdate(ids, payload); set((s) => ({ items: s.items.map((i) => r.find((x) => x.id === i.id) || i), loading: false })); return r; } catch (e) { set({ error: e.message, loading: false }); throw e; } },
  getSelected: () => get().items.find((i) => i.id === get().selectedId) || null,
  reset: () => set({ items: [], selectedId: null, loading: false, error: null, filters: { search: '', status: 'all', sortBy: 'createdAt', sortOrder: 'desc' }, stats: { total: 0, active: 0, completed: 0, pending: 0 } }),
}), { name: 'glowstickexitplan-st', storage: createJSONStorage(() => AsyncStorage), partialize: (s) => ({ items: s.items, filters: s.filters, stats: s.stats }) }));
export default useGlowStickExitPlanStore;
