/**
 * Local storage for GiftRegistryPro
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
const PREFIX = '@weddinggpt/giftregistrypro/';
export async function getGiftRegistryProKey(key) { try { const raw = await AsyncStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : null; } catch { return null; } }
export async function setGiftRegistryProKey(key, value) { try { await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; } }
export async function removeGiftRegistryProKey(key) { try { await AsyncStorage.removeItem(PREFIX + key); return true; } catch { return false; } }
export async function clearGiftRegistryProStorage() { try { const keys = await AsyncStorage.getAllKeys(); const toRemove = keys.filter((k) => k.startsWith(PREFIX)); if (toRemove.length) await AsyncStorage.multiRemove(toRemove); return true; } catch { return false; } }
export async function getGiftRegistryProPrefs() { return (await getGiftRegistryProKey('prefs')) || { defaultView: 'list', pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' }; }
export async function setGiftRegistryProPrefs(prefs) { const current = await getGiftRegistryProPrefs(); return setGiftRegistryProKey('prefs', { ...current, ...prefs }); }
export default { getGiftRegistryProKey, setGiftRegistryProKey, removeGiftRegistryProKey, clearGiftRegistryProStorage, getGiftRegistryProPrefs, setGiftRegistryProPrefs };
