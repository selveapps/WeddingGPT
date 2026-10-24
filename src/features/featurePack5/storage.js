import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = '@weddinggpt/feature-pack-5/';
export const KEYS = Object.freeze({
  vendors: `${PREFIX}vendors:v1`,
  invitations: `${PREFIX}invitations:v1`,
  gifts: `${PREFIX}gifts:v1`,
  honeymoon: `${PREFIX}honeymoon:v1`,
  website: `${PREFIX}website:v1`,
  websiteMeta: `${PREFIX}website-meta:v1`,
});

export async function readValue(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : parsed;
  } catch (error) {
    console.warn(`[WeddingGPT feature pack 5] Read failed: ${key}`, error);
    return fallback;
  }
}

export async function writeValue(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`[WeddingGPT feature pack 5] Write failed: ${key}`, error);
    return false;
  }
}

export function makeId(prefix = 'item') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function clean(value, limit = 1000) {
  return String(value ?? '').trim().slice(0, limit);
}

export function amount(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

export function money(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(amount(value));
}

export function searchText(value) {
  return String(value ?? '').trim().toLocaleLowerCase();
}
