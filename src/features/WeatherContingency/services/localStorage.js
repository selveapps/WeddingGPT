/**
 * Local storage for WeatherContingency
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
const PREFIX = '@weddinggpt/weathercontingency/';
export async function getWeatherContingencyKey(key) { try { const raw = await AsyncStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : null; } catch { return null; } }
export async function setWeatherContingencyKey(key, value) { try { await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; } }
export async function removeWeatherContingencyKey(key) { try { await AsyncStorage.removeItem(PREFIX + key); return true; } catch { return false; } }
export async function clearWeatherContingencyStorage() { try { const keys = await AsyncStorage.getAllKeys(); const toRemove = keys.filter((k) => k.startsWith(PREFIX)); if (toRemove.length) await AsyncStorage.multiRemove(toRemove); return true; } catch { return false; } }
export async function getWeatherContingencyPrefs() { return (await getWeatherContingencyKey('prefs')) || { defaultView: 'list', pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' }; }
export async function setWeatherContingencyPrefs(prefs) { const current = await getWeatherContingencyPrefs(); return setWeatherContingencyKey('prefs', { ...current, ...prefs }); }
export default { getWeatherContingencyKey, setWeatherContingencyKey, removeWeatherContingencyKey, clearWeatherContingencyStorage, getWeatherContingencyPrefs, setWeatherContingencyPrefs };
