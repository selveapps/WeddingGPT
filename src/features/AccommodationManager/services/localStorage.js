/**
 * Local storage for AccommodationManager
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
const PREFIX = '@weddinggpt/accommodationmanager/';
export async function getAccommodationManagerKey(key) { try { const raw = await AsyncStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : null; } catch { return null; } }
export async function setAccommodationManagerKey(key, value) { try { await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; } }
export async function removeAccommodationManagerKey(key) { try { await AsyncStorage.removeItem(PREFIX + key); return true; } catch { return false; } }
export async function clearAccommodationManagerStorage() { try { const keys = await AsyncStorage.getAllKeys(); const toRemove = keys.filter((k) => k.startsWith(PREFIX)); if (toRemove.length) await AsyncStorage.multiRemove(toRemove); return true; } catch { return false; } }
export async function getAccommodationManagerPrefs() { return (await getAccommodationManagerKey('prefs')) || { defaultView: 'list', pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' }; }
export async function setAccommodationManagerPrefs(prefs) { const current = await getAccommodationManagerPrefs(); return setAccommodationManagerKey('prefs', { ...current, ...prefs }); }
export default { getAccommodationManagerKey, setAccommodationManagerKey, removeAccommodationManagerKey, clearAccommodationManagerStorage, getAccommodationManagerPrefs, setAccommodationManagerPrefs };
