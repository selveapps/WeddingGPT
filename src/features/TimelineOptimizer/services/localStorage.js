/**
 * Local storage for TimelineOptimizer
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
const PREFIX = '@weddinggpt/timelineoptimizer/';
export async function getTimelineOptimizerKey(key) { try { const raw = await AsyncStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : null; } catch { return null; } }
export async function setTimelineOptimizerKey(key, value) { try { await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; } }
export async function removeTimelineOptimizerKey(key) { try { await AsyncStorage.removeItem(PREFIX + key); return true; } catch { return false; } }
export async function clearTimelineOptimizerStorage() { try { const keys = await AsyncStorage.getAllKeys(); const toRemove = keys.filter((k) => k.startsWith(PREFIX)); if (toRemove.length) await AsyncStorage.multiRemove(toRemove); return true; } catch { return false; } }
export async function getTimelineOptimizerPrefs() { return (await getTimelineOptimizerKey('prefs')) || { defaultView: 'list', pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' }; }
export async function setTimelineOptimizerPrefs(prefs) { const current = await getTimelineOptimizerPrefs(); return setTimelineOptimizerKey('prefs', { ...current, ...prefs }); }
export default { getTimelineOptimizerKey, setTimelineOptimizerKey, removeTimelineOptimizerKey, clearTimelineOptimizerStorage, getTimelineOptimizerPrefs, setTimelineOptimizerPrefs };
