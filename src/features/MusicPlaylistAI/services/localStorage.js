/**
 * Local storage for MusicPlaylistAI
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
const PREFIX = '@weddinggpt/musicplaylistai/';
export async function getMusicPlaylistAIKey(key) { try { const raw = await AsyncStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : null; } catch { return null; } }
export async function setMusicPlaylistAIKey(key, value) { try { await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; } }
export async function removeMusicPlaylistAIKey(key) { try { await AsyncStorage.removeItem(PREFIX + key); return true; } catch { return false; } }
export async function clearMusicPlaylistAIStorage() { try { const keys = await AsyncStorage.getAllKeys(); const toRemove = keys.filter((k) => k.startsWith(PREFIX)); if (toRemove.length) await AsyncStorage.multiRemove(toRemove); return true; } catch { return false; } }
export async function getMusicPlaylistAIPrefs() { return (await getMusicPlaylistAIKey('prefs')) || { defaultView: 'list', pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' }; }
export async function setMusicPlaylistAIPrefs(prefs) { const current = await getMusicPlaylistAIPrefs(); return setMusicPlaylistAIKey('prefs', { ...current, ...prefs }); }
export default { getMusicPlaylistAIKey, setMusicPlaylistAIKey, removeMusicPlaylistAIKey, clearMusicPlaylistAIStorage, getMusicPlaylistAIPrefs, setMusicPlaylistAIPrefs };
