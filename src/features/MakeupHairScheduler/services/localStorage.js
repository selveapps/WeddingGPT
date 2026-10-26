/**
 * Local storage for MakeupHairScheduler
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
const PREFIX = '@weddinggpt/makeuphairscheduler/';
export async function getMakeupHairSchedulerKey(key) { try { const raw = await AsyncStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : null; } catch { return null; } }
export async function setMakeupHairSchedulerKey(key, value) { try { await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; } }
export async function removeMakeupHairSchedulerKey(key) { try { await AsyncStorage.removeItem(PREFIX + key); return true; } catch { return false; } }
export async function clearMakeupHairSchedulerStorage() { try { const keys = await AsyncStorage.getAllKeys(); const toRemove = keys.filter((k) => k.startsWith(PREFIX)); if (toRemove.length) await AsyncStorage.multiRemove(toRemove); return true; } catch { return false; } }
export async function getMakeupHairSchedulerPrefs() { return (await getMakeupHairSchedulerKey('prefs')) || { defaultView: 'list', pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' }; }
export async function setMakeupHairSchedulerPrefs(prefs) { const current = await getMakeupHairSchedulerPrefs(); return setMakeupHairSchedulerKey('prefs', { ...current, ...prefs }); }
export default { getMakeupHairSchedulerKey, setMakeupHairSchedulerKey, removeMakeupHairSchedulerKey, clearMakeupHairSchedulerStorage, getMakeupHairSchedulerPrefs, setMakeupHairSchedulerPrefs };
