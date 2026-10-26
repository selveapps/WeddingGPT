/**
 * Local storage for PhotoBoothManager
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
const PREFIX = '@weddinggpt/photoboothmanager/';
export async function getPhotoBoothManagerKey(key) { try { const raw = await AsyncStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : null; } catch { return null; } }
export async function setPhotoBoothManagerKey(key, value) { try { await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; } }
export async function removePhotoBoothManagerKey(key) { try { await AsyncStorage.removeItem(PREFIX + key); return true; } catch { return false; } }
export async function clearPhotoBoothManagerStorage() { try { const keys = await AsyncStorage.getAllKeys(); const toRemove = keys.filter((k) => k.startsWith(PREFIX)); if (toRemove.length) await AsyncStorage.multiRemove(toRemove); return true; } catch { return false; } }
export async function getPhotoBoothManagerPrefs() { return (await getPhotoBoothManagerKey('prefs')) || { defaultView: 'list', pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' }; }
export async function setPhotoBoothManagerPrefs(prefs) { const current = await getPhotoBoothManagerPrefs(); return setPhotoBoothManagerKey('prefs', { ...current, ...prefs }); }
export default { getPhotoBoothManagerKey, setPhotoBoothManagerKey, removePhotoBoothManagerKey, clearPhotoBoothManagerStorage, getPhotoBoothManagerPrefs, setPhotoBoothManagerPrefs };
