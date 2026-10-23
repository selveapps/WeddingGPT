import { Share } from 'react-native';

/**
 * Open the system share sheet with plain text. Resolves true when the sheet
 * opened, false if it could not (web without the Web Share API, for one) -
 * callers show a toast rather than failing silently.
 */
export async function shareText(message, title) {
  try {
    await Share.share({ message, title });
    return true;
  } catch {
    return false;
  }
}
