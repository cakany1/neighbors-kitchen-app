import { MapPin, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const mockMeals = [
  {
    id: 1,
    image: '/placeholder-meal-1.jpg',
    title: 'Hausgemachte Kürbis-Lasagne 🎃',
    price: 'CHF 9.00',
    chef: 'Nonna Rosa',
    location: 'Gundeli',
    delay: '0s'
  },
  {
    id: 2,
    image: '/placeholder-meal-2.jpg',
    title: 'Frisches Thai Green Curry 🌶️',
    price: 'CHF 12.50',
    chef: 'Mai L.',
    location: 'St. Johann',
    delay: '0.5s'
  },
  {
    id: 3,
    image: '/placeholder-meal-3.jpg',
    title: 'Sonntagszopf (frisch gebacken)',
    price: 'CHF 6.00',
    chef: 'Lukas',
    location: 'Kleinbasel',
    delay: '1s'
  }
];

export const HeroFeedTeaser = () => {
  return (
    <div className="hidden md:flex flex-col gap-4 max-w-sm">
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
                className="w-full h-32 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <span className="text-foreground font-semibold text-lg">
                  Jetzt reservieren
                </span>
              </div>
            </div>
            <div className="p-3 space-y-2">
              <h3 className="font-semibold text-sm text-foreground line-clamp-1">
                {meal.title}
              </h3>
              <Badge variant="secondary" className="bg-primary/20 text-primary">
                {meal.price}
              </Badge>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>{meal.chef}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{meal.location}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
