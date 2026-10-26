/**
 * Local storage for HoneymoonPlannerAdvanced
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
const PREFIX = '@weddinggpt/honeymoonplanneradvanced/';
export async function getHoneymoonPlannerAdvancedKey(key) { try { const raw = await AsyncStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : null; } catch { return null; } }
export async function setHoneymoonPlannerAdvancedKey(key, value) { try { await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; } }
export async function removeHoneymoonPlannerAdvancedKey(key) { try { await AsyncStorage.removeItem(PREFIX + key); return true; } catch { return false; } }
export async function clearHoneymoonPlannerAdvancedStorage() { try { const keys = await AsyncStorage.getAllKeys(); const toRemove = keys.filter((k) => k.startsWith(PREFIX)); if (toRemove.length) await AsyncStorage.multiRemove(toRemove); return true; } catch { return false; } }
export async function getHoneymoonPlannerAdvancedPrefs() { return (await getHoneymoonPlannerAdvancedKey('prefs')) || { defaultView: 'list', pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' }; }
export async function setHoneymoonPlannerAdvancedPrefs(prefs) { const current = await getHoneymoonPlannerAdvancedPrefs(); return setHoneymoonPlannerAdvancedKey('prefs', { ...current, ...prefs }); }
export default { getHoneymoonPlannerAdvancedKey, setHoneymoonPlannerAdvancedKey, removeHoneymoonPlannerAdvancedKey, clearHoneymoonPlannerAdvancedStorage, getHoneymoonPlannerAdvancedPrefs, setHoneymoonPlannerAdvancedPrefs };
