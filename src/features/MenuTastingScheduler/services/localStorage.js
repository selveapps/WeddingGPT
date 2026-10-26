/**
 * Local storage for MenuTastingScheduler
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
const PREFIX = '@weddinggpt/menutastingscheduler/';
export async function getMenuTastingSchedulerKey(key) { try { const raw = await AsyncStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : null; } catch { return null; } }
export async function setMenuTastingSchedulerKey(key, value) { try { await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; } }
export async function removeMenuTastingSchedulerKey(key) { try { await AsyncStorage.removeItem(PREFIX + key); return true; } catch { return false; } }
export async function clearMenuTastingSchedulerStorage() { try { const keys = await AsyncStorage.getAllKeys(); const toRemove = keys.filter((k) => k.startsWith(PREFIX)); if (toRemove.length) await AsyncStorage.multiRemove(toRemove); return true; } catch { return false; } }
export async function getMenuTastingSchedulerPrefs() { return (await getMenuTastingSchedulerKey('prefs')) || { defaultView: 'list', pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' }; }
export async function setMenuTastingSchedulerPrefs(prefs) { const current = await getMenuTastingSchedulerPrefs(); return setMenuTastingSchedulerKey('prefs', { ...current, ...prefs }); }
export default { getMenuTastingSchedulerKey, setMenuTastingSchedulerKey, removeMenuTastingSchedulerKey, clearMenuTastingSchedulerStorage, getMenuTastingSchedulerPrefs, setMenuTastingSchedulerPrefs };
