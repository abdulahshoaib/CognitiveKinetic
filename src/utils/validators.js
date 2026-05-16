/**
 * Input validation utilities
 */

export function isNonEmpty(text) {
  return typeof text === 'string' && text.trim().length > 0;
}

export function isValidUrl(str) {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

export function hasMinLength(text, min = 10) {
  return typeof text === 'string' && text.trim().length >= min;
}
