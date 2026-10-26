/**
 * Local storage for VendorReviewAggregator
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
const PREFIX = '@weddinggpt/vendorreviewaggregator/';
export async function getVendorReviewAggregatorKey(key) { try { const raw = await AsyncStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : null; } catch { return null; } }
export async function setVendorReviewAggregatorKey(key, value) { try { await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; } }
export async function removeVendorReviewAggregatorKey(key) { try { await AsyncStorage.removeItem(PREFIX + key); return true; } catch { return false; } }
export async function clearVendorReviewAggregatorStorage() { try { const keys = await AsyncStorage.getAllKeys(); const toRemove = keys.filter((k) => k.startsWith(PREFIX)); if (toRemove.length) await AsyncStorage.multiRemove(toRemove); return true; } catch { return false; } }
export async function getVendorReviewAggregatorPrefs() { return (await getVendorReviewAggregatorKey('prefs')) || { defaultView: 'list', pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' }; }
export async function setVendorReviewAggregatorPrefs(prefs) { const current = await getVendorReviewAggregatorPrefs(); return setVendorReviewAggregatorKey('prefs', { ...current, ...prefs }); }
export default { getVendorReviewAggregatorKey, setVendorReviewAggregatorKey, removeVendorReviewAggregatorKey, clearVendorReviewAggregatorStorage, getVendorReviewAggregatorPrefs, setVendorReviewAggregatorPrefs };
