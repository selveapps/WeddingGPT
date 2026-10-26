/**
 * Local storage for LegalDocuments
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
const PREFIX = '@weddinggpt/legaldocuments/';
export async function getLegalDocumentsKey(key) { try { const raw = await AsyncStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : null; } catch { return null; } }
export async function setLegalDocumentsKey(key, value) { try { await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; } }
export async function removeLegalDocumentsKey(key) { try { await AsyncStorage.removeItem(PREFIX + key); return true; } catch { return false; } }
export async function clearLegalDocumentsStorage() { try { const keys = await AsyncStorage.getAllKeys(); const toRemove = keys.filter((k) => k.startsWith(PREFIX)); if (toRemove.length) await AsyncStorage.multiRemove(toRemove); return true; } catch { return false; } }
export async function getLegalDocumentsPrefs() { return (await getLegalDocumentsKey('prefs')) || { defaultView: 'list', pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' }; }
export async function setLegalDocumentsPrefs(prefs) { const current = await getLegalDocumentsPrefs(); return setLegalDocumentsKey('prefs', { ...current, ...prefs }); }
export default { getLegalDocumentsKey, setLegalDocumentsKey, removeLegalDocumentsKey, clearLegalDocumentsStorage, getLegalDocumentsPrefs, setLegalDocumentsPrefs };
