/**
 * Content Safety Filter - Client + Server validation for meal content
 * Blocks profanity, hate speech, sexual content in DE/EN
 * Uses normalization to catch leetspeak and typos
 */

// Blacklist - kept short and impactful, avoid false positives
const BLACKLIST = [
  // English profanity
  'fuck', 'shit', 'bitch', 'cunt', 'nigger', 'faggot', 'retard',
  // German profanity
  'fotze', 'wichser', 'hurensohn', 'schlampe', 'schwuchtel', 'spast',
  'arschloch', 'missgeburt', 'behindert',
  // Hate speech
  'nazi', 'heil hitler', 'sieg heil',
  // Sexual content
  'porno', 'porn', 'sex video', 'nackt',
];

// Leetspeak normalization map
const LEETSPEAK_MAP: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '8': 'b',
  '@': 'a',
  '$': 's',
};

/**
 * Normalize text for comparison:
 * - lowercase
 * - remove punctuation
 * - collapse repeated chars
 * - convert leetspeak
 */
export function normalizeText(text: string): string {
  let normalized = text.toLowerCase();
  
  // Replace leetspeak characters
  for (const [leet, char] of Object.entries(LEETSPEAK_MAP)) {
    normalized = normalized.split(leet).join(char);
  }
  
  // Remove punctuation and special chars except spaces
  normalized = normalized.replace(/[^a-zäöüß\s]/g, '');
  
  // Collapse repeated characters (e.g., "fuuuck" -> "fuck")
  normalized = normalized.replace(/(.)\1{2,}/g, '$1$1');
  
  // Collapse multiple spaces
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

/**
 * Check if text contains prohibited content
 * @returns The matched word if found, null if clean
 */
export function checkContentViolation(text: string): string | null {
  const normalized = normalizeText(text);
  
  for (const word of BLACKLIST) {
    // Check for word as substring
    if (normalized.includes(word)) {
      return word;
    }
  }
  
  return null;
}

/**
 * Validate meal content (title + description)
 * @returns Object with isValid and optional error message
 */
export function validateMealContent(title: string, description: string): { 
  isValid: boolean; 
  error?: string;
  error_en?: string;
} {
  const combinedText = `${title} ${description}`;
  const violation = checkContentViolation(combinedText);
  
  if (violation) {
    return {
      isValid: false,
      error: 'Bitte respektvolle Sprache verwenden. Beleidigende Inhalte sind nicht erlaubt.',
      error_en: 'Please use respectful language. Offensive content is not allowed.',
    };
  }
  
  return { isValid: true };
}
