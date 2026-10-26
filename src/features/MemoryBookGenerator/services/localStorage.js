/**
 * Local storage for MemoryBookGenerator
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
const PREFIX = '@weddinggpt/memorybookgenerator/';
export async function getMemoryBookGeneratorKey(key) { try { const raw = await AsyncStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : null; } catch { return null; } }
export async function setMemoryBookGeneratorKey(key, value) { try { await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; } }
export async function removeMemoryBookGeneratorKey(key) { try { await AsyncStorage.removeItem(PREFIX + key); return true; } catch { return false; } }
export async function clearMemoryBookGeneratorStorage() { try { const keys = await AsyncStorage.getAllKeys(); const toRemove = keys.filter((k) => k.startsWith(PREFIX)); if (toRemove.length) await AsyncStorage.multiRemove(toRemove); return true; } catch { return false; } }
export async function getMemoryBookGeneratorPrefs() { return (await getMemoryBookGeneratorKey('prefs')) || { defaultView: 'list', pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' }; }
export async function setMemoryBookGeneratorPrefs(prefs) { const current = await getMemoryBookGeneratorPrefs(); return setMemoryBookGeneratorKey('prefs', { ...current, ...prefs }); }
export default { getMemoryBookGeneratorKey, setMemoryBookGeneratorKey, removeMemoryBookGeneratorKey, clearMemoryBookGeneratorStorage, getMemoryBookGeneratorPrefs, setMemoryBookGeneratorPrefs };
