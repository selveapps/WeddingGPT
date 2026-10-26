/**
 * Local storage for RSVPAnalytics
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
const PREFIX = '@weddinggpt/rsvpanalytics/';
export async function getRSVPAnalyticsKey(key) { try { const raw = await AsyncStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : null; } catch { return null; } }
export async function setRSVPAnalyticsKey(key, value) { try { await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; } }
export async function removeRSVPAnalyticsKey(key) { try { await AsyncStorage.removeItem(PREFIX + key); return true; } catch { return false; } }
export async function clearRSVPAnalyticsStorage() { try { const keys = await AsyncStorage.getAllKeys(); const toRemove = keys.filter((k) => k.startsWith(PREFIX)); if (toRemove.length) await AsyncStorage.multiRemove(toRemove); return true; } catch { return false; } }
export async function getRSVPAnalyticsPrefs() { return (await getRSVPAnalyticsKey('prefs')) || { defaultView: 'list', pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' }; }
export async function setRSVPAnalyticsPrefs(prefs) { const current = await getRSVPAnalyticsPrefs(); return setRSVPAnalyticsKey('prefs', { ...current, ...prefs }); }
export default { getRSVPAnalyticsKey, setRSVPAnalyticsKey, removeRSVPAnalyticsKey, clearRSVPAnalyticsStorage, getRSVPAnalyticsPrefs, setRSVPAnalyticsPrefs };
