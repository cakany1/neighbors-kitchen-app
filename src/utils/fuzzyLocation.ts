/**
 * Fuzzy Location Utility
 * 
 * Provides consistent hash-based location obfuscation to protect user privacy.
 * Uses deterministic hashing so the same address always gets the same offset,
 * preventing triangulation attacks through statistical analysis of multiple meals.
 */

/**
 * Simple string hash function (djb2 algorithm)
 * Returns a consistent numeric hash for any string input
 */
function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Converts a hash to a normalized float between -1 and 1
 */
function hashToNormalizedFloat(hash: number, seed: number): number {
  // Use different parts of the hash for variety
  const mixed = hash ^ (seed * 2654435761);
  // Normalize to -1 to 1 range
  return ((mixed % 10000) / 10000) * 2 - 1;
}

/**
 * Generates consistent latitude and longitude offsets based on an address string.
 * The same address will always produce the same offset, preventing triangulation.
 * 
 * @param addressKey - A unique string identifying the location (e.g., address + user_id)
 * @returns Object with latOffset and lngOffset (each ±0.003 degrees ≈ ±300m)
 */
export function hashToConsistentOffset(addressKey: string): { latOffset: number; lngOffset: number } {
  const hash = djb2Hash(addressKey);
  
  // Use different seeds for lat/lng to ensure independent offsets
  // Offset range: ±0.003 degrees ≈ ±300 meters (increased from ±200m for better privacy)
  const offsetRange = 0.003;
  
  const latOffset = hashToNormalizedFloat(hash, 1) * offsetRange;
  const lngOffset = hashToNormalizedFloat(hash, 2) * offsetRange;
  
  return { latOffset, lngOffset };
}
