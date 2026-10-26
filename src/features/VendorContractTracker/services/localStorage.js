/**
 * Local storage for VendorContractTracker
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
const PREFIX = '@weddinggpt/vendorcontracttracker/';
export async function getVendorContractTrackerKey(key) { try { const raw = await AsyncStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : null; } catch { return null; } }
export async function setVendorContractTrackerKey(key, value) { try { await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; } }
export async function removeVendorContractTrackerKey(key) { try { await AsyncStorage.removeItem(PREFIX + key); return true; } catch { return false; } }
export async function clearVendorContractTrackerStorage() { try { const keys = await AsyncStorage.getAllKeys(); const toRemove = keys.filter((k) => k.startsWith(PREFIX)); if (toRemove.length) await AsyncStorage.multiRemove(toRemove); return true; } catch { return false; } }
export async function getVendorContractTrackerPrefs() { return (await getVendorContractTrackerKey('prefs')) || { defaultView: 'list', pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' }; }
export async function setVendorContractTrackerPrefs(prefs) { const current = await getVendorContractTrackerPrefs(); return setVendorContractTrackerKey('prefs', { ...current, ...prefs }); }
export default { getVendorContractTrackerKey, setVendorContractTrackerKey, removeVendorContractTrackerKey, clearVendorContractTrackerStorage, getVendorContractTrackerPrefs, setVendorContractTrackerPrefs };
