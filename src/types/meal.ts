export interface Meal {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  chef: {
    firstName: string;
    lastName: string;
    karma: number;
    isVerified?: boolean;
    nickname?: string;
  };
  location: {
    neighborhood: string;
    // Fuzzy location for privacy (approximate lat/lng)
    fuzzyLat: number;
    fuzzyLng: number;
    // Exact location revealed only after booking confirmed
    exactAddress?: string;
  };
  distance?: number; // Distance in meters (optional, calculated on client)
  tags: string[];
  imageUrl?: string;
  pricing: {
    minimum: number; // Can be 0
    suggested?: number;
  };
  exchange_mode?: 'money' | 'barter' | 'pay_what_you_want';
  handover_mode?: 'pickup' | 'pickup_box' | 'neighbor' | 'neighbor_plate' | 'anonymous_drop' | 'dine_in';
  isCookingExperience: boolean;
  availablePortions: number;
  allergens?: string[];
  scheduledDate?: string;
}

export interface Booking {
  id: string;
  mealId: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  exactAddressRevealed: boolean;
  paymentAmount?: number;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  karma: number;
  meals: Meal[];
  bookings: Booking[];
}
