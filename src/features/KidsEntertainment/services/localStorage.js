/**
 * Local storage for KidsEntertainment
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
const PREFIX = '@weddinggpt/kidsentertainment/';
export async function getKidsEntertainmentKey(key) { try { const raw = await AsyncStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : null; } catch { return null; } }
export async function setKidsEntertainmentKey(key, value) { try { await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; } }
export async function removeKidsEntertainmentKey(key) { try { await AsyncStorage.removeItem(PREFIX + key); return true; } catch { return false; } }
export async function clearKidsEntertainmentStorage() { try { const keys = await AsyncStorage.getAllKeys(); const toRemove = keys.filter((k) => k.startsWith(PREFIX)); if (toRemove.length) await AsyncStorage.multiRemove(toRemove); return true; } catch { return false; } }
export async function getKidsEntertainmentPrefs() { return (await getKidsEntertainmentKey('prefs')) || { defaultView: 'list', pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' }; }
export async function setKidsEntertainmentPrefs(prefs) { const current = await getKidsEntertainmentPrefs(); return setKidsEntertainmentKey('prefs', { ...current, ...prefs }); }
export default { getKidsEntertainmentKey, setKidsEntertainmentKey, removeKidsEntertainmentKey, clearKidsEntertainmentStorage, getKidsEntertainmentPrefs, setKidsEntertainmentPrefs };
