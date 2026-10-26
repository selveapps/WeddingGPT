/**
 * Local storage for CostComparisonEngine
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
const PREFIX = '@weddinggpt/costcomparisonengine/';
export async function getCostComparisonEngineKey(key) { try { const raw = await AsyncStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : null; } catch { return null; } }
export async function setCostComparisonEngineKey(key, value) { try { await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; } }
export async function removeCostComparisonEngineKey(key) { try { await AsyncStorage.removeItem(PREFIX + key); return true; } catch { return false; } }
export async function clearCostComparisonEngineStorage() { try { const keys = await AsyncStorage.getAllKeys(); const toRemove = keys.filter((k) => k.startsWith(PREFIX)); if (toRemove.length) await AsyncStorage.multiRemove(toRemove); return true; } catch { return false; } }
export async function getCostComparisonEnginePrefs() { return (await getCostComparisonEngineKey('prefs')) || { defaultView: 'list', pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' }; }
export async function setCostComparisonEnginePrefs(prefs) { const current = await getCostComparisonEnginePrefs(); return setCostComparisonEngineKey('prefs', { ...current, ...prefs }); }
export default { getCostComparisonEngineKey, setCostComparisonEngineKey, removeCostComparisonEngineKey, clearCostComparisonEngineStorage, getCostComparisonEnginePrefs, setCostComparisonEnginePrefs };
