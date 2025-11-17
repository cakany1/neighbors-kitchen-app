import { Meal } from '@/types/meal';

export const mockMeals: Meal[] = [
  {
    id: '1',
    title: 'Vietnamese Summer Rolls',
    description: 'Fresh rice paper rolls filled with herbs, vegetables, and optional prawns. Light and healthy! Contains peanuts.',
    chef: {
      firstName: 'Mai',
      lastName: 'Nguyen',
      karma: 245,
    },
    location: {
      neighborhood: 'St. Johann',
      fuzzyLat: 47.5656,
      fuzzyLng: 7.5845,
      exactAddress: 'Lothringerstrasse 42, 4056 Basel', // Revealed only after confirmation
    },
    distance: '5 min walk',
    tags: ['Vietnamese', 'Vegetarian', 'Gluten-Free'],
    imageUrl: '/placeholder-meal-1.jpg',
    pricing: {
      minimum: 8,
      suggested: 12,
    },
    isCookingExperience: true,
    availablePortions: 4,
    allergens: ['Peanuts'],
  },
  {
    id: '2',
    title: "Nonna's Lasagne",
    description: 'Traditional Bolognese lasagne with homemade béchamel sauce. Recipe passed down through generations!',
    chef: {
      firstName: 'Giovanni',
      lastName: 'Rossi',
      karma: 312,
    },
    location: {
      neighborhood: 'Gundeli',
      fuzzyLat: 47.5448,
      fuzzyLng: 7.6024,
      exactAddress: 'Güterstrasse 15, 4053 Basel',
    },
    distance: '8 min walk',
    tags: ['Italian', 'Comfort Food'],
    imageUrl: '/placeholder-meal-2.jpg',
    pricing: {
      minimum: 10,
      suggested: 15,
    },
    isCookingExperience: false,
    availablePortions: 6,
    allergens: ['Gluten', 'Dairy', 'Eggs'],
  },
  {
    id: '3',
    title: 'Couscous Royal',
    description: 'Aromatic couscous with tender lamb, vegetables, and chickpeas. Authentic North African flavors!',
    chef: {
      firstName: 'Fatima',
      lastName: 'El Amrani',
      karma: 189,
    },
    location: {
      neighborhood: 'Kleinbasel',
      fuzzyLat: 47.5701,
      fuzzyLng: 7.5956,
      exactAddress: 'Klybeckstrasse 88, 4057 Basel',
    },
    distance: '12 min walk',
    tags: ['Moroccan', 'Halal', 'Spicy'],
    imageUrl: '/placeholder-meal-3.jpg',
    pricing: {
      minimum: 12,
      suggested: 18,
    },
    isCookingExperience: true,
    availablePortions: 5,
    allergens: ['Gluten'],
  },
  {
    id: '4',
    title: 'Thai Green Curry',
    description: 'Creamy coconut curry with bamboo shoots, eggplant, and Thai basil. Vegan option available!',
    chef: {
      firstName: 'Somchai',
      lastName: 'Phuket',
      karma: 156,
    },
    location: {
      neighborhood: 'Matthäus',
      fuzzyLat: 47.5522,
      fuzzyLng: 7.5789,
      exactAddress: 'Erlenmattstrasse 22, 4058 Basel',
    },
    distance: '6 min walk',
    tags: ['Thai', 'Vegan', 'Spicy'],
    imageUrl: '/placeholder-meal-4.jpg',
    pricing: {
      minimum: 0,
      suggested: 10,
    },
    isCookingExperience: false,
    availablePortions: 3,
    allergens: [],
  },
];
