/**
 * Local storage for BudgetForecastAI
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
const PREFIX = '@weddinggpt/budgetforecastai/';
export async function getBudgetForecastAIKey(key) { try { const raw = await AsyncStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : null; } catch { return null; } }
export async function setBudgetForecastAIKey(key, value) { try { await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; } }
export async function removeBudgetForecastAIKey(key) { try { await AsyncStorage.removeItem(PREFIX + key); return true; } catch { return false; } }
export async function clearBudgetForecastAIStorage() { try { const keys = await AsyncStorage.getAllKeys(); const toRemove = keys.filter((k) => k.startsWith(PREFIX)); if (toRemove.length) await AsyncStorage.multiRemove(toRemove); return true; } catch { return false; } }
export async function getBudgetForecastAIPrefs() { return (await getBudgetForecastAIKey('prefs')) || { defaultView: 'list', pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' }; }
export async function setBudgetForecastAIPrefs(prefs) { const current = await getBudgetForecastAIPrefs(); return setBudgetForecastAIKey('prefs', { ...current, ...prefs }); }
export default { getBudgetForecastAIKey, setBudgetForecastAIKey, removeBudgetForecastAIKey, clearBudgetForecastAIStorage, getBudgetForecastAIPrefs, setBudgetForecastAIPrefs };
