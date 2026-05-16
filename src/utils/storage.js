/**
 * AsyncStorage helpers for persistence
 */
import { Platform } from 'react-native';

// Stub — will use @react-native-async-storage/async-storage when installed
const memoryStore = {};

export async function getItem(key) {
  return memoryStore[key] || null;
}

export async function setItem(key, value) {
  memoryStore[key] = value;
}

export async function removeItem(key) {
  delete memoryStore[key];
}

export default { getItem, setItem, removeItem };
