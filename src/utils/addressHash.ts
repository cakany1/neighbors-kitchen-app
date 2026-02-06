/**
 * Generate a deterministic address hash for same-address filtering.
 * Uses djb2 hash algorithm matching the SQL generate_address_id function.
 * IMPORTANT: This must match the SQL djb2_hash function exactly!
 */
export const generateAddressId = (street: string, city: string, postalCode: string): string => {
  const normalized = `${street.trim().toLowerCase()}-${city.trim().toLowerCase()}-${postalCode.trim()}`;
  
  // djb2 hash function - must match SQL implementation exactly
  let hash = 5381;
  for (let i = 0; i < normalized.length; i++) {
    // hash * 33 + charCode
    hash = (hash * 33) + normalized.charCodeAt(i);
    // Match SQL: keep only lower 31 bits to avoid overflow
    hash = hash & 0x7FFFFFFF;
  }
  
  return hash.toString(16);
};
