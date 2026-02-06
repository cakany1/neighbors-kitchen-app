/**
 * Generate a deterministic address hash for same-address filtering.
 * Uses a simple string hash to ensure the same address always produces the same ID.
 */
export const generateAddressId = (street: string, city: string, postalCode: string): string => {
  const normalized = `${street.trim().toLowerCase()}-${city.trim().toLowerCase()}-${postalCode.trim()}`;
  
  // Simple djb2 hash function for deterministic results
  let hash = 5381;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) + hash) + normalized.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(16);
};
