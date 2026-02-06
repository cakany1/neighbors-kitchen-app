/**
 * Price validation utility with localized error messages
 * Enforces CHF 7-50 range for money exchange mode
 */

export const MIN_PRICE_CHF = 7;
export const MAX_PRICE_CHF = 50;

export interface PriceValidationResult {
  isValid: boolean;
  error?: string;
  errorKey?: string; // i18n key for the error
}

/**
 * Parse a localized number string (handles both "10.50" and "10,50" formats)
 */
export function parseLocalizedNumber(value: string): number {
  if (!value || value.trim() === '') return 0;
  // Replace comma with dot for parsing
  const normalized = value.replace(',', '.');
  return parseFloat(normalized);
}

/**
 * Validate a price value for the money exchange mode
 * @param value - The input value (string from form)
 * @param t - i18next translation function
 * @param isMoneyMode - Whether the exchange mode is 'money' (online payment)
 */
export function validatePrice(
  value: string,
  t: (key: string) => string,
  isMoneyMode: boolean
): PriceValidationResult {
  // If not in money mode, price validation is not needed
  if (!isMoneyMode) {
    return { isValid: true };
  }

  const parsedValue = parseLocalizedNumber(value);

  // Check for invalid number
  if (isNaN(parsedValue)) {
    return {
      isValid: false,
      error: t('validation.invalid_number'),
      errorKey: 'validation.invalid_number',
    };
  }

  // Check minimum (CHF 7)
  if (parsedValue < MIN_PRICE_CHF) {
    return {
      isValid: false,
      error: t('add_meal.price_min_error'),
      errorKey: 'add_meal.price_min_error',
    };
  }

  // Check maximum (CHF 50)
  if (parsedValue > MAX_PRICE_CHF) {
    return {
      isValid: false,
      error: t('add_meal.price_max_error'),
      errorKey: 'add_meal.price_max_error',
    };
  }

  return { isValid: true };
}

/**
 * Format price to CHF display format
 */
export function formatPriceCHF(value: number): string {
  return `CHF ${value.toFixed(2)}`;
}

/**
 * Convert CHF to cents for database storage
 */
export function chfToCents(chf: number): number {
  return Math.round(chf * 100);
}

/**
 * Convert cents to CHF for display
 */
export function centsToChf(cents: number): number {
  return cents / 100;
}

/**
 * Map database constraint errors to localized messages
 */
export function mapDbPriceError(
  errorMessage: string,
  t: (key: string) => string
): string {
  // Match PostgreSQL check constraint violation for price
  if (errorMessage.includes('pricing_minimum') || errorMessage.includes('check constraint')) {
    if (errorMessage.includes('700')) {
      return t('add_meal.price_min_error');
    }
    if (errorMessage.includes('5000')) {
      return t('add_meal.price_max_error');
    }
    // Generic price constraint error
    return t('add_meal.price_max_error');
  }
  
  // Return original if no mapping found
  return errorMessage;
}
