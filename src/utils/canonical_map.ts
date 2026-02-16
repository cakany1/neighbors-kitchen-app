/**
 * Canonical Allergen/Tag Intelligence Layer
 *
 * Deterministic normalization + matching for allergens, tags, and dislikes.
 * No LLM calls — pure dictionary lookup with fallback slugification.
 *
 * Phase 1 (this file): synonym dictionary, normalize(), matchAllergens()
 * Phase 2 (future):    embedding-based fuzzy matching for unknown terms
 */

import i18next from 'i18next';

// ─── Synonym → Canonical Key ──────────────────────────────────
// Keys are lowercased. Values are the canonical DB key.
const SYNONYM_MAP: Record<string, string> = {
  // ── Allergens (EU-14) ──
  // Gluten
  gluten: 'gluten', weizen: 'gluten', wheat: 'gluten', mehl: 'gluten',
  dinkel: 'gluten', roggen: 'gluten', gerste: 'gluten', hafer: 'gluten',
  pasta: 'gluten', nudel: 'gluten', nudeln: 'gluten', spaghetti: 'gluten',
  lasagne: 'gluten', brot: 'gluten', teig: 'gluten', spätzle: 'gluten',
  couscous: 'gluten', bulgur: 'gluten', seitan: 'gluten',

  // Dairy
  dairy: 'dairy', milch: 'dairy', laktose: 'dairy', lactose: 'dairy',
  milk: 'dairy', sahne: 'dairy', käse: 'dairy', butter: 'dairy',
  joghurt: 'dairy', yogurt: 'dairy', rahm: 'dairy', quark: 'dairy',
  schmand: 'dairy', cream: 'dairy', parmesan: 'dairy', mozzarella: 'dairy',
  'milch / laktose': 'dairy', 'milch/laktose': 'dairy',

  // Nuts (tree nuts)
  nuts: 'nuts', nüsse: 'nuts', nuss: 'nuts', 'tree nuts': 'nuts',
  schalenfrüchte: 'nuts', mandel: 'nuts', mandeln: 'nuts', almonds: 'nuts',
  walnuss: 'nuts', walnuts: 'nuts', haselnuss: 'nuts', hazelnuts: 'nuts',
  cashew: 'nuts', cashews: 'nuts', pistazie: 'nuts', pistachios: 'nuts',
  pecans: 'nuts', 'schalenfrüchte (nüsse)': 'nuts',

  // Peanuts (separate from tree nuts per EU law)
  peanuts: 'peanuts', peanut: 'peanuts', erdnuss: 'peanuts', erdnüsse: 'peanuts',
  'peanut butter': 'peanuts',

  // Eggs
  eggs: 'eggs', egg: 'eggs', eier: 'eggs', ei: 'eggs',
  mayonnaise: 'eggs',

  // Fish
  fish: 'fish', fisch: 'fish', thunfisch: 'fish', lachs: 'fish',
  salmon: 'fish', tuna: 'fish', cod: 'fish', anchovy: 'fish',
  forelle: 'fish', sardine: 'fish',

  // Crustaceans
  crustaceans: 'crustaceans', krebstiere: 'crustaceans',
  garnele: 'crustaceans', garnelen: 'crustaceans', shrimp: 'crustaceans',
  lobster: 'crustaceans', hummer: 'crustaceans', krabbe: 'crustaceans',
  crab: 'crustaceans', prawns: 'crustaceans', shellfish: 'crustaceans',

  // Molluscs
  molluscs: 'molluscs', weichtiere: 'molluscs',
  muschel: 'molluscs', muscheln: 'molluscs', mussels: 'molluscs',
  tintenfisch: 'molluscs', squid: 'molluscs', schnecke: 'molluscs',
  schnecken: 'molluscs', oysters: 'molluscs', clams: 'molluscs',

  // Soy
  soy: 'soy', soja: 'soy', tofu: 'soy', 'soy sauce': 'soy',
  edamame: 'soy', tempeh: 'soy',

  // Celery
  celery: 'celery', sellerie: 'celery',

  // Mustard
  mustard: 'mustard', senf: 'mustard',

  // Sesame
  sesame: 'sesame', sesam: 'sesame', tahini: 'sesame',

  // Sulphites
  sulphites: 'sulphites', sulfite: 'sulphites', sulfit: 'sulphites',
  schwefeldioxid: 'sulphites', wine: 'sulphites', 'dried fruit': 'sulphites',

  // Lupin
  lupin: 'lupin', lupine: 'lupin', lupinen: 'lupin',

  // ── Tags ──
  vegetarisch: 'vegetarian', veggie: 'vegetarian', vegi: 'vegetarian', vegetarian: 'vegetarian',
  vegan: 'vegan', pflanzlich: 'vegan',
  halal: 'halal',
  koscher: 'kosher', kosher: 'kosher',
  scharf: 'spicy', spicy: 'spicy', pikant: 'spicy',
  glutenfrei: 'gluten_free', 'gluten-free': 'gluten_free',
  laktosefrei: 'lactose_free', 'lactose-free': 'lactose_free',
  bio: 'organic', organic: 'organic',
  hausgemacht: 'homemade', homemade: 'homemade', selbstgemacht: 'homemade',
  kindgerecht: 'kid_friendly', kinderfreundlich: 'kid_friendly',
  pescatarian: 'pescatarian', pescetarisch: 'pescatarian',
  low_carb: 'low_carb', 'low carb': 'low_carb', kohlenhydratarm: 'low_carb',
  mild: 'mild',

  // ── Dislikes ──
  koriander: 'coriander', coriander: 'coriander', cilantro: 'coriander',
  pilze: 'mushrooms', mushrooms: 'mushrooms', champignon: 'mushrooms',
  oliven: 'olives', olives: 'olives',
  zwiebeln: 'onions', onions: 'onions', zwiebel: 'onions',
  knoblauch: 'garlic', garlic: 'garlic',
  schweinefleisch: 'pork', pork: 'pork',
  lamm: 'lamb', lamb: 'lamb',
  blauschimmelkäse: 'blue_cheese', 'blue cheese': 'blue_cheese',
  'sehr süss': 'very_sweet', 'very sweet': 'very_sweet',
};

/**
 * Normalize any user-entered text to a canonical key.
 * 1. Lowercase + trim
 * 2. Check synonym map (direct match)
 * 3. Partial / compound check — collect ALL matches, return longest synonym match
 *    to avoid false positives (e.g. "Hafermilch" → "dairy" not "gluten")
 * 4. If unknown → return as-is
 */
export function normalize(raw: string): string {
  const key = raw.toLowerCase().trim();
  if (!key) return key;

  // Direct match — highest confidence
  if (SYNONYM_MAP[key]) return SYNONYM_MAP[key];

  // Partial / compound check: find the LONGEST matching synonym
  // to prefer specific matches over short generic ones
  let bestMatch: string | null = null;
  let bestLength = 0;

  for (const [synonym, canonical] of Object.entries(SYNONYM_MAP)) {
    if (synonym.length >= 3 && key.includes(synonym) && synonym.length > bestLength) {
      bestMatch = canonical;
      bestLength = synonym.length;
    }
  }

  if (bestMatch) return bestMatch;

  // Unknown term → keep as-is (backward-compatible)
  return key;
}

/**
 * Normalize an array of tags/allergens, deduplicating after normalization.
 */
export function normalizeAll(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const canonical = normalize(item);
    if (canonical && !seen.has(canonical)) {
      seen.add(canonical);
      result.push(canonical);
    }
  }
  return result;
}

/**
 * Match user allergens against meal allergens.
 * Both sides are normalized before comparison.
 *
 * @returns Array of matching canonical allergen keys
 */
export function matchAllergens(
  userAllergens: string[],
  mealAllergens: string[],
): string[] {
  const normalizedUser = new Set(normalizeAll(userAllergens));
  const normalizedMeal = normalizeAll(mealAllergens);
  return normalizedMeal.filter((a) => normalizedUser.has(a));
}

/**
 * Match user dislikes against meal ingredients/tags.
 * @returns Array of matching canonical dislike keys
 */
export function matchDislikes(
  userDislikes: string[],
  mealTags: string[],
  mealIngredients: string[] = [],
): string[] {
  const normalizedUser = new Set(normalizeAll(userDislikes));
  const combined = normalizeAll([...mealTags, ...mealIngredients]);
  return combined.filter((item) => normalizedUser.has(item));
}

/**
 * Get a human-readable, locale-aware label for a canonical key.
 * Looks up `canonical_labels.<key>` in i18n; falls back to the raw key.
 */
export function getDisplayLabel(canonicalKey: string): string {
  const i18nKey = `canonical_labels.${canonicalKey}`;
  const translated = i18next.t(i18nKey);
  // i18next returns the key itself when no translation is found
  return translated !== i18nKey ? translated : canonicalKey;
}
