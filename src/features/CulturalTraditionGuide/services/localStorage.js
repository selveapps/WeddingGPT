/**
 * Local storage for CulturalTraditionGuide
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
const PREFIX = '@weddinggpt/culturaltraditionguide/';
export async function getCulturalTraditionGuideKey(key) { try { const raw = await AsyncStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : null; } catch { return null; } }
export async function setCulturalTraditionGuideKey(key, value) { try { await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; } }
export async function removeCulturalTraditionGuideKey(key) { try { await AsyncStorage.removeItem(PREFIX + key); return true; } catch { return false; } }
export async function clearCulturalTraditionGuideStorage() { try { const keys = await AsyncStorage.getAllKeys(); const toRemove = keys.filter((k) => k.startsWith(PREFIX)); if (toRemove.length) await AsyncStorage.multiRemove(toRemove); return true; } catch { return false; } }
export async function getCulturalTraditionGuidePrefs() { return (await getCulturalTraditionGuideKey('prefs')) || { defaultView: 'list', pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' }; }
export async function setCulturalTraditionGuidePrefs(prefs) { const current = await getCulturalTraditionGuidePrefs(); return setCulturalTraditionGuideKey('prefs', { ...current, ...prefs }); }
export default { getCulturalTraditionGuideKey, setCulturalTraditionGuideKey, removeCulturalTraditionGuideKey, clearCulturalTraditionGuideStorage, getCulturalTraditionGuidePrefs, setCulturalTraditionGuidePrefs };
