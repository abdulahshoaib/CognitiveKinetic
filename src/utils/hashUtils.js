/**
 * Simple hash utility for generating deterministic IDs from strings.
 * Uses a fast non-cryptographic hash suitable for feed item deduplication.
 */

export function createHash(str) {
  const input = String(str || '');
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash |= 0; // Convert to 32-bit integer
  }
  // Convert to hex and pad to ensure consistent length
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  return `f${hex}${input.length.toString(16).padStart(4, '0')}`;
}
