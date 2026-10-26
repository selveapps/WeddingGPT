/**
 * Local storage for GuestExperienceSurvey
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
const PREFIX = '@weddinggpt/guestexperiencesurvey/';
export async function getGuestExperienceSurveyKey(key) { try { const raw = await AsyncStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : null; } catch { return null; } }
export async function setGuestExperienceSurveyKey(key, value) { try { await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; } }
export async function removeGuestExperienceSurveyKey(key) { try { await AsyncStorage.removeItem(PREFIX + key); return true; } catch { return false; } }
export async function clearGuestExperienceSurveyStorage() { try { const keys = await AsyncStorage.getAllKeys(); const toRemove = keys.filter((k) => k.startsWith(PREFIX)); if (toRemove.length) await AsyncStorage.multiRemove(toRemove); return true; } catch { return false; } }
export async function getGuestExperienceSurveyPrefs() { return (await getGuestExperienceSurveyKey('prefs')) || { defaultView: 'list', pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' }; }
export async function setGuestExperienceSurveyPrefs(prefs) { const current = await getGuestExperienceSurveyPrefs(); return setGuestExperienceSurveyKey('prefs', { ...current, ...prefs }); }
export default { getGuestExperienceSurveyKey, setGuestExperienceSurveyKey, removeGuestExperienceSurveyKey, clearGuestExperienceSurveyStorage, getGuestExperienceSurveyPrefs, setGuestExperienceSurveyPrefs };
