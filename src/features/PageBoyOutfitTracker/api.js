/** PageBoyOutfitTracker API */
import AsyncStorage from '@react-native-async-storage/async-storage';
const KEY = '@wgpt/pageboyoutfittracker';
const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms));
const nid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
async function read() { try { const r = await AsyncStorage.getItem(KEY); return r ? JSON.parse(r) : { items: [] }; } catch { return { items: [] }; } }
async function write(d) { await AsyncStorage.setItem(KEY, JSON.stringify(d)); }
export const PageBoyOutfitTrackerAPI = {
  async list(p = {}) { await delay(); const s = await read(); let items = [...s.items]; if (p.search) { const q = String(p.search).toLowerCase(); items = items.filter((i) => (i.name || '').toLowerCase().includes(q)); } if (p.status && p.status !== 'all') items = items.filter((i) => i.status === p.status); const stats = { total: s.items.length, active: s.items.filter((i) => i.status === 'active').length, completed: s.items.filter((i) => i.status === 'completed').length, pending: s.items.filter((i) => i.status === 'pending').length }; return { data: items, total: items.length, stats }; },
  async get(id) { await delay(); const s = await read(); const i = s.items.find((x) => x.id === id); if (!i) throw new Error('Not found'); return i; },
  async create(payload) { await delay(); const s = await read(); const now = new Date().toISOString(); const item = { id: nid(), ...payload, status: payload.status || 'pending', createdAt: now, updatedAt: now }; s.items.unshift(item); await write(s); return item; },
  async update(id, payload) { await delay(); const s = await read(); const idx = s.items.findIndex((x) => x.id === id); if (idx < 0) throw new Error('Not found'); s.items[idx] = { ...s.items[idx], ...payload, id, updatedAt: new Date().toISOString() }; await write(s); return s.items[idx]; },
  async remove(id) { await delay(); const s = await read(); s.items = s.items.filter((x) => x.id !== id); await write(s); return true; },
  async bulkUpdate(ids, payload) { await delay(); const s = await read(); const out = []; for (const id of ids) { const idx = s.items.findIndex((x) => x.id === id); if (idx >= 0) { s.items[idx] = { ...s.items[idx], ...payload, updatedAt: new Date().toISOString() }; out.push(s.items[idx]); } } await write(s); return out; },
  async exportData() { const s = await read(); return { feature: 'PageBoyOutfitTracker', exportedAt: new Date().toISOString(), items: s.items }; },
  async clearAll() { await write({ items: [] }); return true; },
};
export default PageBoyOutfitTrackerAPI;
