// Mock ingredient database for allergen auto-detection
export const ingredientDB: Record<string, string[]> = {
  // Gluten sources
  "pasta": ["gluten"],
  "flour": ["gluten"],
  "bread": ["gluten"],
  "wheat": ["gluten"],
  "noodles": ["gluten"],
  "couscous": ["gluten"],
  "bulgur": ["gluten"],
  "seitan": ["gluten"],
  
  // Dairy sources
  "milk": ["dairy"],
  "cheese": ["dairy"],
  "butter": ["dairy"],
  "cream": ["dairy"],
  "yogurt": ["dairy"],
  "parmesan": ["dairy"],
  "mozzarella": ["dairy"],
  
  // Nuts
  "peanuts": ["nuts"],
  "almonds": ["nuts"],
  "walnuts": ["nuts"],
  "cashews": ["nuts"],
  "hazelnuts": ["nuts"],
  "pistachios": ["nuts"],
  "pecans": ["nuts"],
  
  // Eggs
  "eggs": ["eggs"],
  "egg": ["eggs"],
  "mayonnaise": ["eggs"],
  
  // Shellfish & Crustaceans
  "shrimp": ["crustaceans"],
  "lobster": ["crustaceans"],
  "crab": ["crustaceans"],
  "prawns": ["crustaceans"],
  "oysters": ["molluscs"],
  "mussels": ["molluscs"],
  "clams": ["molluscs"],
  "squid": ["molluscs"],
  
  // Fish
  "salmon": ["fish"],
  "tuna": ["fish"],
  "cod": ["fish"],
  "anchovy": ["fish"],
  
  // Peanuts (separate from tree nuts)
  "peanut butter": ["peanuts"],
  
  // Celery
  "celery": ["celery"],
  
  // Mustard
  "mustard": ["mustard"],
  
  // Sesame
  "sesame": ["sesame"],
  "tahini": ["sesame"],
  
  // Sulphites
  "wine": ["sulphites"],
  "dried fruit": ["sulphites"],
  
  // Lupin
  "lupin": ["lupin"],
  
  // Soy
  "soy": ["soy"],
  "tofu": ["soy"],
  "soy sauce": ["soy"],
  "edamame": ["soy"],
  "tempeh": ["soy"],
};

// The Official 14 EU Allergens - German Labels
export const allergenOptions = [
  { value: "gluten", label: "Gluten (Getreide)" },
  { value: "crustaceans", label: "Krebstiere" },
  { value: "eggs", label: "Eier" },
  { value: "fish", label: "Fisch" },
  { value: "peanuts", label: "Erdnüsse" },
  { value: "soy", label: "Soja" },
  { value: "dairy", label: "Milch / Laktose" },
  { value: "nuts", label: "Schalenfrüchte (Nüsse)" },
  { value: "celery", label: "Sellerie" },
  { value: "mustard", label: "Senf" },
  { value: "sesame", label: "Sesam" },
  { value: "sulphites", label: "Sulfite" },
  { value: "lupin", label: "Lupinen" },
  { value: "molluscs", label: "Weichtiere" },
];

// Categorized Dislikes (Accordion UI)
export const dislikeCategories = {
  herbs: [
    { value: "coriander", label: "Coriander/Cilantro" },
    { value: "parsley", label: "Parsley" },
    { value: "mint", label: "Mint" },
  ],
  vegetables: [
    { value: "mushrooms", label: "Mushrooms" },
    { value: "olives", label: "Olives" },
    { value: "tomatoes", label: "Tomatoes" },
    { value: "onions", label: "Onions" },
  ],
  meat: [
    { value: "pork", label: "Pork" },
    { value: "beef", label: "Beef" },
    { value: "lamb", label: "Lamb" },
  ],
  seafood: [
    { value: "fish", label: "Fish" },
    { value: "shellfish", label: "Shellfish" },
  ],
  dairy: [
    { value: "blue_cheese", label: "Blue Cheese" },
    { value: "goat_cheese", label: "Goat Cheese" },
  ],
  taste: [
    { value: "spicy", label: "Spicy Food" },
    { value: "sweet", label: "Very Sweet" },
    { value: "sour", label: "Very Sour" },
  ],
};

export const exchangeOptions = [
  { value: "money", label: "Geld (Online Bezahlung)", note: "min. CHF 7.-" },
  { value: "wine", label: "Eine Flasche Wein", icon: "🍷" },
  { value: "dessert", label: "Dessert / Süsses", icon: "🍰" },
  { value: "produce", label: "Früchte / Gemüse", icon: "🍎" },
  { value: "surprise", label: "Überrasch mich!", icon: "🎁" },
  { value: "smile", label: "Nichts / Nur ein Lächeln (Gratis)", icon: "😊" },
];

/**
 * Detects allergens from a list of ingredients
 * @param ingredients Array of ingredient strings
 * @returns Array of detected allergens
 */
export function detectAllergens(ingredients: string[]): string[] {
  const detectedAllergens = new Set<string>();
  
  ingredients.forEach(ingredient => {
    const lowerIngredient = ingredient.toLowerCase().trim();
    
    // Check each word in the ingredient database
    Object.entries(ingredientDB).forEach(([key, allergens]) => {
      if (lowerIngredient.includes(key)) {
        allergens.forEach(allergen => detectedAllergens.add(allergen));
      }
    });
  });
  
  return Array.from(detectedAllergens);
}

/**
 * Checks if a meal contains allergens that match user's profile
 * @param mealAllergens Allergens in the meal
 * @param userAllergens User's allergens from profile
 * @returns Array of matching allergens
 */
export function checkAllergenMatch(mealAllergens: string[], userAllergens: string[]): string[] {
  return mealAllergens.filter(allergen => userAllergens.includes(allergen));
}
