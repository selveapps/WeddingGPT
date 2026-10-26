/**
 * Local storage for SeatingChartAI
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
const PREFIX = '@weddinggpt/seatingchartai/';
export async function getSeatingChartAIKey(key) { try { const raw = await AsyncStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : null; } catch { return null; } }
export async function setSeatingChartAIKey(key, value) { try { await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; } }
export async function removeSeatingChartAIKey(key) { try { await AsyncStorage.removeItem(PREFIX + key); return true; } catch { return false; } }
export async function clearSeatingChartAIStorage() { try { const keys = await AsyncStorage.getAllKeys(); const toRemove = keys.filter((k) => k.startsWith(PREFIX)); if (toRemove.length) await AsyncStorage.multiRemove(toRemove); return true; } catch { return false; } }
export async function getSeatingChartAIPrefs() { return (await getSeatingChartAIKey('prefs')) || { defaultView: 'list', pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' }; }
export async function setSeatingChartAIPrefs(prefs) { const current = await getSeatingChartAIPrefs(); return setSeatingChartAIKey('prefs', { ...current, ...prefs }); }
export default { getSeatingChartAIKey, setSeatingChartAIKey, removeSeatingChartAIKey, clearSeatingChartAIStorage, getSeatingChartAIPrefs, setSeatingChartAIPrefs };
