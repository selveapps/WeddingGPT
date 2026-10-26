/**
 * Local storage for AnniversaryPlanner
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
const PREFIX = '@weddinggpt/anniversaryplanner/';
export async function getAnniversaryPlannerKey(key) { try { const raw = await AsyncStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : null; } catch { return null; } }
export async function setAnniversaryPlannerKey(key, value) { try { await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; } }
export async function removeAnniversaryPlannerKey(key) { try { await AsyncStorage.removeItem(PREFIX + key); return true; } catch { return false; } }
export async function clearAnniversaryPlannerStorage() { try { const keys = await AsyncStorage.getAllKeys(); const toRemove = keys.filter((k) => k.startsWith(PREFIX)); if (toRemove.length) await AsyncStorage.multiRemove(toRemove); return true; } catch { return false; } }
export async function getAnniversaryPlannerPrefs() { return (await getAnniversaryPlannerKey('prefs')) || { defaultView: 'list', pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' }; }
export async function setAnniversaryPlannerPrefs(prefs) { const current = await getAnniversaryPlannerPrefs(); return setAnniversaryPlannerKey('prefs', { ...current, ...prefs }); }
export default { getAnniversaryPlannerKey, setAnniversaryPlannerKey, removeAnniversaryPlannerKey, clearAnniversaryPlannerStorage, getAnniversaryPlannerPrefs, setAnniversaryPlannerPrefs };
