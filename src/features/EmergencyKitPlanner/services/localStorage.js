/**
 * Local storage for EmergencyKitPlanner
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
const PREFIX = '@weddinggpt/emergencykitplanner/';
export async function getEmergencyKitPlannerKey(key) { try { const raw = await AsyncStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : null; } catch { return null; } }
export async function setEmergencyKitPlannerKey(key, value) { try { await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; } }
export async function removeEmergencyKitPlannerKey(key) { try { await AsyncStorage.removeItem(PREFIX + key); return true; } catch { return false; } }
export async function clearEmergencyKitPlannerStorage() { try { const keys = await AsyncStorage.getAllKeys(); const toRemove = keys.filter((k) => k.startsWith(PREFIX)); if (toRemove.length) await AsyncStorage.multiRemove(toRemove); return true; } catch { return false; } }
export async function getEmergencyKitPlannerPrefs() { return (await getEmergencyKitPlannerKey('prefs')) || { defaultView: 'list', pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' }; }
export async function setEmergencyKitPlannerPrefs(prefs) { const current = await getEmergencyKitPlannerPrefs(); return setEmergencyKitPlannerKey('prefs', { ...current, ...prefs }); }
export default { getEmergencyKitPlannerKey, setEmergencyKitPlannerKey, removeEmergencyKitPlannerKey, clearEmergencyKitPlannerStorage, getEmergencyKitPlannerPrefs, setEmergencyKitPlannerPrefs };
