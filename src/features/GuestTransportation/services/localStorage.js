/**
 * Local storage for GuestTransportation
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
const PREFIX = '@weddinggpt/guesttransportation/';
export async function getGuestTransportationKey(key) { try { const raw = await AsyncStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : null; } catch { return null; } }
export async function setGuestTransportationKey(key, value) { try { await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; } }
export async function removeGuestTransportationKey(key) { try { await AsyncStorage.removeItem(PREFIX + key); return true; } catch { return false; } }
export async function clearGuestTransportationStorage() { try { const keys = await AsyncStorage.getAllKeys(); const toRemove = keys.filter((k) => k.startsWith(PREFIX)); if (toRemove.length) await AsyncStorage.multiRemove(toRemove); return true; } catch { return false; } }
export async function getGuestTransportationPrefs() { return (await getGuestTransportationKey('prefs')) || { defaultView: 'list', pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' }; }
export async function setGuestTransportationPrefs(prefs) { const current = await getGuestTransportationPrefs(); return setGuestTransportationKey('prefs', { ...current, ...prefs }); }
export default { getGuestTransportationKey, setGuestTransportationKey, removeGuestTransportationKey, clearGuestTransportationStorage, getGuestTransportationPrefs, setGuestTransportationPrefs };
