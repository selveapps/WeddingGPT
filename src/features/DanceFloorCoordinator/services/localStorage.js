/**
 * Local storage for DanceFloorCoordinator
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
const PREFIX = '@weddinggpt/dancefloorcoordinator/';
export async function getDanceFloorCoordinatorKey(key) { try { const raw = await AsyncStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : null; } catch { return null; } }
export async function setDanceFloorCoordinatorKey(key, value) { try { await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; } }
export async function removeDanceFloorCoordinatorKey(key) { try { await AsyncStorage.removeItem(PREFIX + key); return true; } catch { return false; } }
export async function clearDanceFloorCoordinatorStorage() { try { const keys = await AsyncStorage.getAllKeys(); const toRemove = keys.filter((k) => k.startsWith(PREFIX)); if (toRemove.length) await AsyncStorage.multiRemove(toRemove); return true; } catch { return false; } }
export async function getDanceFloorCoordinatorPrefs() { return (await getDanceFloorCoordinatorKey('prefs')) || { defaultView: 'list', pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' }; }
export async function setDanceFloorCoordinatorPrefs(prefs) { const current = await getDanceFloorCoordinatorPrefs(); return setDanceFloorCoordinatorKey('prefs', { ...current, ...prefs }); }
export default { getDanceFloorCoordinatorKey, setDanceFloorCoordinatorKey, removeDanceFloorCoordinatorKey, clearDanceFloorCoordinatorStorage, getDanceFloorCoordinatorPrefs, setDanceFloorCoordinatorPrefs };
