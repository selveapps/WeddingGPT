/**
 * Local storage for NameChangeHelper
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
const PREFIX = '@weddinggpt/namechangehelper/';
export async function getNameChangeHelperKey(key) { try { const raw = await AsyncStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : null; } catch { return null; } }
export async function setNameChangeHelperKey(key, value) { try { await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; } }
export async function removeNameChangeHelperKey(key) { try { await AsyncStorage.removeItem(PREFIX + key); return true; } catch { return false; } }
export async function clearNameChangeHelperStorage() { try { const keys = await AsyncStorage.getAllKeys(); const toRemove = keys.filter((k) => k.startsWith(PREFIX)); if (toRemove.length) await AsyncStorage.multiRemove(toRemove); return true; } catch { return false; } }
export async function getNameChangeHelperPrefs() { return (await getNameChangeHelperKey('prefs')) || { defaultView: 'list', pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' }; }
export async function setNameChangeHelperPrefs(prefs) { const current = await getNameChangeHelperPrefs(); return setNameChangeHelperKey('prefs', { ...current, ...prefs }); }
export default { getNameChangeHelperKey, setNameChangeHelperKey, removeNameChangeHelperKey, clearNameChangeHelperStorage, getNameChangeHelperPrefs, setNameChangeHelperPrefs };
