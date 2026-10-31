import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Directory, File, Paths } from 'expo-file-system';

import { createId, timestampFromId } from '../../lib/id';

/**
 * Photos the couple adds to their vision board (slice J1), kept on this
 * phone only, in the app's own documents folder, so they survive the photo
 * being deleted from the camera roll.
 *
 * What syncs is a `photo` record on the idea, `{ key, width, height }`; the
 * file itself does not (there is no file storage on the server yet). On
 * another phone `photoUri(key)` is null and the board says the photo is on
 * the phone that added it.
 *
 * Browsers have no lasting file storage to copy into, so photos are a phone
 * feature: `PHOTOS_SUPPORTED` is false on the web.
 */

export const PHOTOS_SUPPORTED = Platform.OS === 'ios' || Platform.OS === 'android';

const FOLDER = 'vision';
/** Big enough to fill a phone screen, small enough that 100 photos stay light. */
const QUALITY = 0.7;
/** Unused photos younger than this are left alone by `prunePhotos`. */
const PRUNE_AFTER_MS = 24 * 60 * 60 * 1000;

// One folder per wedding, so switching workspace never touches another
// wedding's photos.
const safeId = (weddingId) => String(weddingId ?? 'local').replace(/[^0-9A-Za-z_-]/g, '');
const folder = (weddingId) => new Directory(Paths.document, FOLDER, safeId(weddingId));
const isKey = (key) => typeof key === 'string' && /^photo_[0-9A-Za-z]+\.(jpg|png|heic|webp)$/.test(key);

function extension(asset) {
  const name = (asset.fileName ?? asset.uri ?? '').toLowerCase();
  const match = /\.(jpe?g|png|heic|webp)$/.exec(name);
  if (!match) return 'jpg';
  return match[1] === 'jpeg' ? 'jpg' : match[1];
}

/**
 * Let the couple choose one photo from their library and keep a copy with
 * the wedding's photos.
 * Resolves to `{ status: 'picked', photo }`, or a status of 'cancelled',
 * 'denied', 'unsupported' or 'failed'.
 */
export async function pickPhoto(weddingId) {
  if (!PHOTOS_SUPPORTED) return { status: 'unsupported' };
  try {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return { status: 'denied' };

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: QUALITY });
    if (result.canceled || !result.assets?.length) return { status: 'cancelled' };

    const [asset] = result.assets;
    const dir = folder(weddingId);
    dir.create({ idempotent: true, intermediates: true });
    const key = `${createId('photo')}.${extension(asset)}`;
    await new File(asset.uri).copy(new File(dir, key));
    return {
      status: 'picked',
      photo: { key, width: asset.width || null, height: asset.height || null },
    };
  } catch (error) {
    if (__DEV__) console.warn('[photos] Could not keep the photo', error);
    return { status: 'failed' };
  }
}

/** The file URI of a kept photo, or null when it is not on this phone. */
export function photoUri(weddingId, key) {
  if (!PHOTOS_SUPPORTED || !isKey(key)) return null;
  try {
    const file = new File(folder(weddingId), key);
    return file.exists ? file.uri : null;
  } catch {
    return null;
  }
}

/** Delete a kept photo. Missing photos and other phones' keys are fine. */
export function removePhoto(weddingId, key) {
  if (!PHOTOS_SUPPORTED || !isKey(key)) return false;
  try {
    const file = new File(folder(weddingId), key);
    if (!file.exists) return false;
    file.delete();
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete kept photos no idea uses any more: one picked for an idea that was
 * never saved, or an idea deleted on the other phone. `keep` is every photo
 * key still on the wedding's board. Only photos over a day old go, so one
 * just picked, or a board briefly behind while it syncs, never loses a
 * photo. Returns how many were deleted.
 */
export function prunePhotos(weddingId, keep = [], now = Date.now()) {
  if (!PHOTOS_SUPPORTED || !weddingId) return 0;
  try {
    const dir = folder(weddingId);
    if (!dir.exists) return 0;
    const used = new Set(keep);
    let removed = 0;
    for (const entry of dir.list()) {
      const name = entry instanceof File ? entry.name : '';
      const added = timestampFromId(name.replace(/\.\w+$/, ''));
      if (isKey(name) && !used.has(name) && added !== null && now - added > PRUNE_AFTER_MS) {
        entry.delete();
        removed += 1;
      }
    }
    return removed;
  } catch {
    return 0;
  }
}
