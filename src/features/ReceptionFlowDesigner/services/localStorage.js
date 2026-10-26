/**
 * Local storage for ReceptionFlowDesigner
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
const PREFIX = '@weddinggpt/receptionflowdesigner/';
export async function getReceptionFlowDesignerKey(key) { try { const raw = await AsyncStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : null; } catch { return null; } }
export async function setReceptionFlowDesignerKey(key, value) { try { await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; } }
export async function removeReceptionFlowDesignerKey(key) { try { await AsyncStorage.removeItem(PREFIX + key); return true; } catch { return false; } }
export async function clearReceptionFlowDesignerStorage() { try { const keys = await AsyncStorage.getAllKeys(); const toRemove = keys.filter((k) => k.startsWith(PREFIX)); if (toRemove.length) await AsyncStorage.multiRemove(toRemove); return true; } catch { return false; } }
export async function getReceptionFlowDesignerPrefs() { return (await getReceptionFlowDesignerKey('prefs')) || { defaultView: 'list', pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' }; }
export async function setReceptionFlowDesignerPrefs(prefs) { const current = await getReceptionFlowDesignerPrefs(); return setReceptionFlowDesignerKey('prefs', { ...current, ...prefs }); }
export default { getReceptionFlowDesignerKey, setReceptionFlowDesignerKey, removeReceptionFlowDesignerKey, clearReceptionFlowDesignerStorage, getReceptionFlowDesignerPrefs, setReceptionFlowDesignerPrefs };
