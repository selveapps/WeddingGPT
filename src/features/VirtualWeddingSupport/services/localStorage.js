/**
 * Local storage for VirtualWeddingSupport
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
const PREFIX = '@weddinggpt/virtualweddingsupport/';
export async function getVirtualWeddingSupportKey(key) { try { const raw = await AsyncStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : null; } catch { return null; } }
export async function setVirtualWeddingSupportKey(key, value) { try { await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; } }
export async function removeVirtualWeddingSupportKey(key) { try { await AsyncStorage.removeItem(PREFIX + key); return true; } catch { return false; } }
export async function clearVirtualWeddingSupportStorage() { try { const keys = await AsyncStorage.getAllKeys(); const toRemove = keys.filter((k) => k.startsWith(PREFIX)); if (toRemove.length) await AsyncStorage.multiRemove(toRemove); return true; } catch { return false; } }
export async function getVirtualWeddingSupportPrefs() { return (await getVirtualWeddingSupportKey('prefs')) || { defaultView: 'list', pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' }; }
export async function setVirtualWeddingSupportPrefs(prefs) { const current = await getVirtualWeddingSupportPrefs(); return setVirtualWeddingSupportKey('prefs', { ...current, ...prefs }); }
export default { getVirtualWeddingSupportKey, setVirtualWeddingSupportKey, removeVirtualWeddingSupportKey, clearVirtualWeddingSupportStorage, getVirtualWeddingSupportPrefs, setVirtualWeddingSupportPrefs };
