export interface Meal {
  id: string;
  title: string;
  description: string;
  chef: {
    firstName: string;
    lastName: string;
    karma: number;
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
  imageUrl: string;
  pricing: {
    minimum: number; // Can be 0
    suggested?: number;
  };
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
