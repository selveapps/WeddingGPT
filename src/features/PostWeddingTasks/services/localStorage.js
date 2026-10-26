/**
 * Local storage for PostWeddingTasks
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
const PREFIX = '@weddinggpt/postweddingtasks/';
export async function getPostWeddingTasksKey(key) { try { const raw = await AsyncStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : null; } catch { return null; } }
export async function setPostWeddingTasksKey(key, value) { try { await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; } }
export async function removePostWeddingTasksKey(key) { try { await AsyncStorage.removeItem(PREFIX + key); return true; } catch { return false; } }
export async function clearPostWeddingTasksStorage() { try { const keys = await AsyncStorage.getAllKeys(); const toRemove = keys.filter((k) => k.startsWith(PREFIX)); if (toRemove.length) await AsyncStorage.multiRemove(toRemove); return true; } catch { return false; } }
export async function getPostWeddingTasksPrefs() { return (await getPostWeddingTasksKey('prefs')) || { defaultView: 'list', pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' }; }
export async function setPostWeddingTasksPrefs(prefs) { const current = await getPostWeddingTasksPrefs(); return setPostWeddingTasksKey('prefs', { ...current, ...prefs }); }
export default { getPostWeddingTasksKey, setPostWeddingTasksKey, removePostWeddingTasksKey, clearPostWeddingTasksStorage, getPostWeddingTasksPrefs, setPostWeddingTasksPrefs };
