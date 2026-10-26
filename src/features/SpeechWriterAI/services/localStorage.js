/**
 * Local storage for SpeechWriterAI
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
const PREFIX = '@weddinggpt/speechwriterai/';
export async function getSpeechWriterAIKey(key) { try { const raw = await AsyncStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : null; } catch { return null; } }
export async function setSpeechWriterAIKey(key, value) { try { await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; } }
export async function removeSpeechWriterAIKey(key) { try { await AsyncStorage.removeItem(PREFIX + key); return true; } catch { return false; } }
export async function clearSpeechWriterAIStorage() { try { const keys = await AsyncStorage.getAllKeys(); const toRemove = keys.filter((k) => k.startsWith(PREFIX)); if (toRemove.length) await AsyncStorage.multiRemove(toRemove); return true; } catch { return false; } }
export async function getSpeechWriterAIPrefs() { return (await getSpeechWriterAIKey('prefs')) || { defaultView: 'list', pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' }; }
export async function setSpeechWriterAIPrefs(prefs) { const current = await getSpeechWriterAIPrefs(); return setSpeechWriterAIKey('prefs', { ...current, ...prefs }); }
export default { getSpeechWriterAIKey, setSpeechWriterAIKey, removeSpeechWriterAIKey, clearSpeechWriterAIStorage, getSpeechWriterAIPrefs, setSpeechWriterAIPrefs };
