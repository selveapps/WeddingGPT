/**
 * Local storage for DecorVisualizer
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
const PREFIX = '@weddinggpt/decorvisualizer/';
export async function getDecorVisualizerKey(key) { try { const raw = await AsyncStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : null; } catch { return null; } }
export async function setDecorVisualizerKey(key, value) { try { await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; } }
export async function removeDecorVisualizerKey(key) { try { await AsyncStorage.removeItem(PREFIX + key); return true; } catch { return false; } }
export async function clearDecorVisualizerStorage() { try { const keys = await AsyncStorage.getAllKeys(); const toRemove = keys.filter((k) => k.startsWith(PREFIX)); if (toRemove.length) await AsyncStorage.multiRemove(toRemove); return true; } catch { return false; } }
export async function getDecorVisualizerPrefs() { return (await getDecorVisualizerKey('prefs')) || { defaultView: 'list', pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' }; }
export async function setDecorVisualizerPrefs(prefs) { const current = await getDecorVisualizerPrefs(); return setDecorVisualizerKey('prefs', { ...current, ...prefs }); }
export default { getDecorVisualizerKey, setDecorVisualizerKey, removeDecorVisualizerKey, clearDecorVisualizerStorage, getDecorVisualizerPrefs, setDecorVisualizerPrefs };
