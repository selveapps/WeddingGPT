import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = '@weddinggpt/feature-pack-3/';

export const STORAGE_KEYS = Object.freeze({
  timeline: `${PREFIX}timeline:v1`,
  vendors: `${PREFIX}vendors:v1`,
  checklist: `${PREFIX}checklist:v1`,
});

export async function readJson(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch (error) {
    console.warn(`[feature-pack-3] Could not read ${key}`, error);
    return fallback;
  }
}

export async function writeJson(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return { ok: true };
  } catch (error) {
    console.warn(`[feature-pack-3] Could not write ${key}`, error);
    return { ok: false, error };
  }
}

export async function removeStoredValue(key) {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`[feature-pack-3] Could not remove ${key}`, error);
    return false;
  }
}

export function makeId(prefix = 'item') {
  const random = Math.random().toString(36).slice(2, 9);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
}

export function cleanText(value, maxLength = 160) {
  return String(value ?? '').trim().slice(0, maxLength);
}

export function toPositiveNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}
