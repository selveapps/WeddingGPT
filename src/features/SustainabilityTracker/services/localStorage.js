/**
 * Local storage for SustainabilityTracker
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
const PREFIX = '@weddinggpt/sustainabilitytracker/';
export async function getSustainabilityTrackerKey(key) { try { const raw = await AsyncStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : null; } catch { return null; } }
export async function setSustainabilityTrackerKey(key, value) { try { await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; } }
export async function removeSustainabilityTrackerKey(key) { try { await AsyncStorage.removeItem(PREFIX + key); return true; } catch { return false; } }
export async function clearSustainabilityTrackerStorage() { try { const keys = await AsyncStorage.getAllKeys(); const toRemove = keys.filter((k) => k.startsWith(PREFIX)); if (toRemove.length) await AsyncStorage.multiRemove(toRemove); return true; } catch { return false; } }
export async function getSustainabilityTrackerPrefs() { return (await getSustainabilityTrackerKey('prefs')) || { defaultView: 'list', pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' }; }
export async function setSustainabilityTrackerPrefs(prefs) { const current = await getSustainabilityTrackerPrefs(); return setSustainabilityTrackerKey('prefs', { ...current, ...prefs }); }
export default { getSustainabilityTrackerKey, setSustainabilityTrackerKey, removeSustainabilityTrackerKey, clearSustainabilityTrackerStorage, getSustainabilityTrackerPrefs, setSustainabilityTrackerPrefs };
