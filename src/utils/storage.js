/**
 * AsyncStorage helpers for persistence
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getItem(key) {
  return AsyncStorage.getItem(key);
}

export async function setItem(key, value) {
  return AsyncStorage.setItem(key, value);
}

export async function removeItem(key) {
  return AsyncStorage.removeItem(key);
}

export async function getJSON(key, fallback = null) {
  const stored = await getItem(key);
  if (!stored) return fallback;
  return JSON.parse(stored);
}

export async function setJSON(key, value) {
  return setItem(key, JSON.stringify(value));
}

export default { getItem, setItem, removeItem, getJSON, setJSON };
