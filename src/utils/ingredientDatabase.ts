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
  
  // Shellfish
  "shrimp": ["shellfish"],
  "lobster": ["shellfish"],
  "crab": ["shellfish"],
  "prawns": ["shellfish"],
  "oysters": ["shellfish"],
  "mussels": ["shellfish"],
  
  // Soy
  "soy": ["soy"],
  "tofu": ["soy"],
  "soy sauce": ["soy"],
  "edamame": ["soy"],
  "tempeh": ["soy"],
};

export const allergenOptions = [
  { value: "gluten", label: "Gluten" },
  { value: "nuts", label: "Nuts" },
  { value: "dairy", label: "Dairy" },
  { value: "shellfish", label: "Shellfish" },
  { value: "soy", label: "Soy" },
  { value: "eggs", label: "Eggs" },
];

export const dislikeOptions = [
  { value: "coriander", label: "Coriander" },
  { value: "mushrooms", label: "Mushrooms" },
  { value: "pork", label: "Pork" },
  { value: "fish", label: "Fish" },
  { value: "spicy", label: "Spicy Food" },
];

export const barterOptions = [
  "A Bottle of Wine",
  "Dessert",
  "Fruit",
  "Surprise Me",
  "Just a Smile (Free)",
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
