/**
 * GuestTransportation API Service - WeddingGPT Extension
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@weddinggpt/guesttransportation_data';
const delay = (ms = 280) => new Promise((r) => setTimeout(r, ms));
const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

async function readStore() {
  try { const raw = await AsyncStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : { items: [] }; }
  catch { return { items: [] }; }
}
async function writeStore(data) { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

export const GuestTransportationAPI = {
  async list(params = {}) {
    await delay();
    const store = await readStore();
    let items = [...store.items];
    if (params.search) { const q = String(params.search).toLowerCase(); items = items.filter((i) => (i.name || '').toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q)); }
    if (params.status && params.status !== 'all') items = items.filter((i) => i.status === params.status);
    const total = items.length;
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const pageItems = items.slice((page - 1) * pageSize, page * pageSize);
    const stats = { total: store.items.length, active: store.items.filter((i) => i.status === 'active').length, completed: store.items.filter((i) => i.status === 'completed').length, pending: store.items.filter((i) => i.status === 'pending').length };
    return { data: pageItems, total, stats, page, pageSize };
  },
  async get(id) { await delay(); const store = await readStore(); const item = store.items.find((i) => i.id === id); if (!item) throw new Error('Not found'); return item; },
  async create(payload) {
    await delay();
    const store = await readStore();
    const now = new Date().toISOString();
    const item = { id: generateId(), ...payload, status: payload.status || 'pending', createdAt: now, updatedAt: now, version: 1 };
    store.items.unshift(item);
    await writeStore(store);
    return item;
  },
  async update(id, payload) {
    await delay();
    const store = await readStore();
    const idx = store.items.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error('Not found');
    const updated = { ...store.items[idx], ...payload, id, updatedAt: new Date().toISOString(), version: (store.items[idx].version || 1) + 1 };
    store.items[idx] = updated;
    await writeStore(store);
    return updated;
  },
  async remove(id) { await delay(); const store = await readStore(); store.items = store.items.filter((i) => i.id !== id); await writeStore(store); return true; },
  async bulkUpdate(ids, payload) {
    await delay();
    const store = await readStore();
    const results = [];
    for (const id of ids) { const idx = store.items.findIndex((i) => i.id === id); if (idx !== -1) { store.items[idx] = { ...store.items[idx], ...payload, updatedAt: new Date().toISOString() }; results.push(store.items[idx]); } }
    await writeStore(store);
    return results;
  },
  async exportData() { const store = await readStore(); return { exportedAt: new Date().toISOString(), feature: 'GuestTransportation', count: store.items.length, items: store.items }; },
  async importData(data) {
    if (!data || !Array.isArray(data.items)) throw new Error('Invalid import');
    const store = await readStore();
    const existing = new Set(store.items.map((i) => i.id));
    let added = 0;
    for (const item of data.items) { if (!existing.has(item.id)) { store.items.push(item); added++; } }
    await writeStore(store);
    return { added, total: store.items.length };
  },
  async clearAll() { await writeStore({ items: [] }); return true; },
};
export default GuestTransportationAPI;
