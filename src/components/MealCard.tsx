import { Meal } from '@/types/meal';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Star, MapPin, ChefHat, Calendar, Gift, Heart, Camera, Package, Home, Ghost, UtensilsCrossed } from 'lucide-react';
import { TranslateButton } from '@/components/TranslateButton';
import { VerificationBadge } from '@/components/VerificationBadge';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDistance } from '@/utils/distance';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface MealCardProps {
  meal: Meal;
  onClick: () => void;
  userAllergens?: string[];
}

export const MealCard = ({ meal, onClick, userAllergens = [] }: MealCardProps) => {
  const { t } = useTranslation();
  const [translatedTitle, setTranslatedTitle] = useState(meal.title);
  
  // Mock data - in real app this would come from database
  const exchangeMode = meal.id === 'meal_103' ? 'barter' : 'money';
  const barterRequests = ['White Wine', 'Dessert'];
  const isStockPhoto = false; // Mock - would come from meal.is_stock_photo
  // Mock handover mode - vary by meal for demo
  let handoverMode: 'pickup_box' | 'neighbor_plate' | 'anonymous_drop' | 'dine_in' = 'pickup_box';
  if (meal.id === 'meal_102') handoverMode = 'dine_in';
  if (meal.id === 'meal_103') handoverMode = 'anonymous_drop';
  const estimatedValue = meal.pricing.suggested || 24;
  
  // Mock chef nickname
  const chefNickname = "FoodieChef";

  const handoverIcons = {
    pickup_box: Package,
    neighbor_plate: Home,
    anonymous_drop: Ghost,
    dine_in: UtensilsCrossed,
  };

  const handoverLabels = {
    pickup_box: t('handover.pickupTupperware'),
    neighbor_plate: t('handover.neighborPlate'),
    anonymous_drop: t('handover.anonymousDrop'),
    dine_in: t('handover.dineIn'),
  };

  const HandoverIcon = handoverIcons[handoverMode as keyof typeof handoverIcons] || Package;
  
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
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {isStockPhoto && (
            <Badge className="bg-secondary/90 backdrop-blur-sm text-secondary-foreground flex items-center gap-1">
              <Camera className="w-3 h-3" />
              Symbolic Image
            </Badge>
          )}
          {meal.isCookingExperience && (
            <Badge className="bg-secondary text-secondary-foreground">
              Cooking Experience
            </Badge>
          )}
          {handoverMode === 'dine_in' && (
            <Badge className="bg-primary text-primary-foreground flex items-center gap-1">
              <UtensilsCrossed className="w-3 h-3" />
              Dine In
            </Badge>
          )}
          {handoverMode === 'anonymous_drop' && (
            <Badge className="bg-muted text-muted-foreground flex items-center gap-1">
              <Ghost className="w-3 h-3" />
              Ghost Mode
            </Badge>
          )}
          {meal.availablePortions > 0 && (
            <Badge className="bg-primary/90 backdrop-blur text-primary-foreground font-bold">
              Noch {meal.availablePortions}
            </Badge>
          )}
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2 gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <h3 className="font-semibold text-lg text-card-foreground">{translatedTitle}</h3>
              <TranslateButton 
                originalText={meal.title} 
                onTranslate={setTranslatedTitle} 
              />
            </div>
          </div>
          <div className="flex items-center gap-1 text-trust-gold shrink-0">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-sm font-medium">{meal.chef.karma}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <span className="font-medium flex items-center gap-1">
            {chefNickname}
            {meal.chef.isVerified && <VerificationBadge isVerified={true} size="sm" />}
          </span>
          <span>•</span>
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>{meal.location.neighborhood}</span>
          </div>
          {meal.distance !== undefined && (
            <>
              <span>•</span>
              <span className="font-medium text-primary">📍 {formatDistance(meal.distance)}</span>
            </>
          )}
        </div>
        
        {/* Chef Portfolio Badge - Shows trust signal */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
          <Camera className="w-3.5 h-3.5 text-primary" />
          <span className="text-primary font-medium">Portfolio Available</span>
        </div>
        
        {meal.scheduledDate && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3 bg-muted px-2 py-1 rounded-md w-fit">
            <Calendar className="w-3.5 h-3.5" />
            <span>{format(new Date(meal.scheduledDate), 'EEE, d. MMM', { locale: de })}</span>
          </div>
        )}
        
        <div className="flex flex-wrap gap-2 mb-3">
          {meal.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        
        <div className="pt-3 border-t border-border space-y-2">
          {/* The "No Price Tag" Badge */}
          <div className="flex items-center justify-center gap-2 py-2 px-3 bg-primary/10 rounded-lg">
            <Heart className="w-4 h-4 text-primary fill-current" />
            <span className="text-sm font-semibold text-primary">
              {t('common.payWhatYouWant')}
            </span>
          </div>

          {/* Barter Info (if applicable) */}
          {exchangeMode === 'barter' && (
            <div className="flex items-center justify-center gap-2 text-sm text-secondary">
              <Gift className="w-4 h-4" />
              <span>{t('common.orBring')}: {barterRequests.join(', ')}</span>
            </div>
          )}

          {/* Handover Mode */}
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <HandoverIcon className="w-3.5 h-3.5" />
            <span>{handoverLabels[handoverMode as keyof typeof handoverLabels] || handoverMode}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
