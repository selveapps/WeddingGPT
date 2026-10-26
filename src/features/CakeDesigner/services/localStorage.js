/**
 * Local storage for CakeDesigner
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
const PREFIX = '@weddinggpt/cakedesigner/';
export async function getCakeDesignerKey(key) { try { const raw = await AsyncStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : null; } catch { return null; } }
export async function setCakeDesignerKey(key, value) { try { await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; } }
export async function removeCakeDesignerKey(key) { try { await AsyncStorage.removeItem(PREFIX + key); return true; } catch { return false; } }
export async function clearCakeDesignerStorage() { try { const keys = await AsyncStorage.getAllKeys(); const toRemove = keys.filter((k) => k.startsWith(PREFIX)); if (toRemove.length) await AsyncStorage.multiRemove(toRemove); return true; } catch { return false; } }
export async function getCakeDesignerPrefs() { return (await getCakeDesignerKey('prefs')) || { defaultView: 'list', pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' }; }
export async function setCakeDesignerPrefs(prefs) { const current = await getCakeDesignerPrefs(); return setCakeDesignerKey('prefs', { ...current, ...prefs }); }
export default { getCakeDesignerKey, setCakeDesignerKey, removeCakeDesignerKey, clearCakeDesignerStorage, getCakeDesignerPrefs, setCakeDesignerPrefs };
