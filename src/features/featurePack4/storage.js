import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = '@weddinggpt/feature-pack-4/';
export const STORAGE_KEYS = Object.freeze({
  budget: `${PREFIX}budget:v1`,
  guests: `${PREFIX}guests:v1`,
  seating: `${PREFIX}seating:v1`,
});

export async function loadStoredValue(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : parsed;
  } catch (error) {
    console.warn(`[WeddingGPT] Could not read local key "${key}"`, error);
    return fallback;
  }
}

export async function saveStoredValue(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`[WeddingGPT] Could not save local key "${key}"`, error);
    return false;
  }
}

export function makeId(prefix = 'item') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function cleanText(value, maxLength = 240) {
  return String(value ?? '').trim().slice(0, maxLength);
}

export function finiteNonNegative(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

export function safeArray(value) {
  return Array.isArray(value) ? value : [];
}
