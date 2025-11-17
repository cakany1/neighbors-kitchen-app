import { Meal } from '@/types/meal';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Star, MapPin, ChefHat, Calendar, Gift } from 'lucide-react';

interface MealCardProps {
  meal: Meal;
  onClick: () => void;
  userAllergens?: string[];
}

export const MealCard = ({ meal, onClick, userAllergens = [] }: MealCardProps) => {
  // Mock exchange mode for demonstration
  const exchangeMode = meal.id === 'meal_103' ? 'barter' : 'money';
  const barterRequests = ['White Wine', 'Dessert'];
  
  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 border-border"
      onClick={onClick}
    >
      <div className="relative h-48 bg-muted">
        {meal.imageUrl ? (
          <img 
            src={meal.imageUrl} 
            alt={meal.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ChefHat className="w-16 h-16 text-muted-foreground" />
          </div>
        )}
        {meal.isCookingExperience && (
          <Badge className="absolute top-3 right-3 bg-secondary text-secondary-foreground">
            Cooking Experience
          </Badge>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg text-card-foreground">{meal.title}</h3>
          <div className="flex items-center gap-1 text-trust-gold">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-sm font-medium">{meal.chef.karma}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <span className="font-medium">{meal.chef.firstName} {meal.chef.lastName.charAt(0)}.</span>
          <span>•</span>
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>{meal.distance}</span>
          </div>
        </div>
        
        {meal.scheduledDate && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3 bg-muted px-2 py-1 rounded-md w-fit">
            <Calendar className="w-3.5 h-3.5" />
            <span>Available: {new Date(meal.scheduledDate).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>
        )}
        
        <div className="flex flex-wrap gap-2 mb-3">
          {meal.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t border-border">
          {exchangeMode === 'money' ? (
            <>
              <div>
                <span className="text-sm text-muted-foreground">From </span>
                <span className="font-semibold text-primary">
                  {meal.pricing.minimum === 0 ? 'Free' : `CHF ${meal.pricing.minimum}`}
                </span>
              </div>
              <span className="text-xs text-muted-foreground italic">Pay what you want</span>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-secondary" />
              <span className="text-sm font-medium text-secondary">
                Exchange: {barterRequests.join(' or ')}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
