import { MapPin, User, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const mockMeals = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80',
    title: 'Hausgemachte Kürbis-Lasagne 🎃',
    restaurantValue: 'CHF 25.-',
    chef: 'Nonna Rosa',
    location: 'Gundeli',
    delay: '0s'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800&q=80',
    title: 'Frisches Thai Green Curry 🌶️',
    restaurantValue: 'CHF 22.-',
    chef: 'Mai L.',
    location: 'St. Johann',
    delay: '0.2s'
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
    title: 'Sonntagszopf (frisch gebacken)',
    restaurantValue: 'CHF 12.-',
    chef: 'Lukas',
    location: 'Kleinbasel',
    delay: '0.4s'
  }
];

export const HeroFeedTeaser = () => {
  return (
    <div className="w-full max-w-6xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mockMeals.map((meal) => (
          <Card
            key={meal.id}
            className="group relative overflow-hidden bg-background/60 backdrop-blur-md border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-float cursor-pointer"
            style={{ animationDelay: meal.delay }}
          >
            <CardContent className="p-0">
              <div className="relative">
                <img
                  src={meal.image}
                  alt={meal.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="text-foreground font-semibold text-lg">
                    Jetzt reservieren
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-base text-foreground line-clamp-1">
                  {meal.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  ~ Restaurant-Wert: {meal.restaurantValue}
                </p>
                <Badge variant="secondary" className="bg-primary/20 text-primary flex items-center gap-1 w-fit">
                  <Heart className="w-3 h-3" />
                  <span>Zahl was du willst</span>
                </Badge>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>{meal.chef}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{meal.location}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
