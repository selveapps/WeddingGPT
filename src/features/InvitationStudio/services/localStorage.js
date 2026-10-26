/**
 * Local storage for InvitationStudio
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
const PREFIX = '@weddinggpt/invitationstudio/';
export async function getInvitationStudioKey(key) { try { const raw = await AsyncStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : null; } catch { return null; } }
export async function setInvitationStudioKey(key, value) { try { await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; } }
export async function removeInvitationStudioKey(key) { try { await AsyncStorage.removeItem(PREFIX + key); return true; } catch { return false; } }
export async function clearInvitationStudioStorage() { try { const keys = await AsyncStorage.getAllKeys(); const toRemove = keys.filter((k) => k.startsWith(PREFIX)); if (toRemove.length) await AsyncStorage.multiRemove(toRemove); return true; } catch { return false; } }
export async function getInvitationStudioPrefs() { return (await getInvitationStudioKey('prefs')) || { defaultView: 'list', pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' }; }
export async function setInvitationStudioPrefs(prefs) { const current = await getInvitationStudioPrefs(); return setInvitationStudioKey('prefs', { ...current, ...prefs }); }
export default { getInvitationStudioKey, setInvitationStudioKey, removeInvitationStudioKey, clearInvitationStudioStorage, getInvitationStudioPrefs, setInvitationStudioPrefs };
