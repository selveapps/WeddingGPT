/**
 * Local storage for PetInclusionPlanner
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
const PREFIX = '@weddinggpt/petinclusionplanner/';
export async function getPetInclusionPlannerKey(key) { try { const raw = await AsyncStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : null; } catch { return null; } }
export async function setPetInclusionPlannerKey(key, value) { try { await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; } }
export async function removePetInclusionPlannerKey(key) { try { await AsyncStorage.removeItem(PREFIX + key); return true; } catch { return false; } }
export async function clearPetInclusionPlannerStorage() { try { const keys = await AsyncStorage.getAllKeys(); const toRemove = keys.filter((k) => k.startsWith(PREFIX)); if (toRemove.length) await AsyncStorage.multiRemove(toRemove); return true; } catch { return false; } }
export async function getPetInclusionPlannerPrefs() { return (await getPetInclusionPlannerKey('prefs')) || { defaultView: 'list', pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' }; }
export async function setPetInclusionPlannerPrefs(prefs) { const current = await getPetInclusionPlannerPrefs(); return setPetInclusionPlannerKey('prefs', { ...current, ...prefs }); }
export default { getPetInclusionPlannerKey, setPetInclusionPlannerKey, removePetInclusionPlannerKey, clearPetInclusionPlannerStorage, getPetInclusionPlannerPrefs, setPetInclusionPlannerPrefs };
