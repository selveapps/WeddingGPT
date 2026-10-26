/**
 * Local storage for PhotoAlbumCollaborator
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
const PREFIX = '@weddinggpt/photoalbumcollaborator/';
export async function getPhotoAlbumCollaboratorKey(key) { try { const raw = await AsyncStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : null; } catch { return null; } }
export async function setPhotoAlbumCollaboratorKey(key, value) { try { await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; } }
export async function removePhotoAlbumCollaboratorKey(key) { try { await AsyncStorage.removeItem(PREFIX + key); return true; } catch { return false; } }
export async function clearPhotoAlbumCollaboratorStorage() { try { const keys = await AsyncStorage.getAllKeys(); const toRemove = keys.filter((k) => k.startsWith(PREFIX)); if (toRemove.length) await AsyncStorage.multiRemove(toRemove); return true; } catch { return false; } }
export async function getPhotoAlbumCollaboratorPrefs() { return (await getPhotoAlbumCollaboratorKey('prefs')) || { defaultView: 'list', pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' }; }
export async function setPhotoAlbumCollaboratorPrefs(prefs) { const current = await getPhotoAlbumCollaboratorPrefs(); return setPhotoAlbumCollaboratorKey('prefs', { ...current, ...prefs }); }
export default { getPhotoAlbumCollaboratorKey, setPhotoAlbumCollaboratorKey, removePhotoAlbumCollaboratorKey, clearPhotoAlbumCollaboratorStorage, getPhotoAlbumCollaboratorPrefs, setPhotoAlbumCollaboratorPrefs };
