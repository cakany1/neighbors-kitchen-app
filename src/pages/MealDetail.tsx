import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockMeals } from '@/data/mockMeals';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SafetyAlert } from '@/components/SafetyAlert';
import { TranslateButton } from '@/components/TranslateButton';
import { checkAllergenMatch } from '@/utils/ingredientDatabase';
import FuzzyLocationMap from '@/components/maps/FuzzyLocationMap';
import ChatModal from '@/components/ChatModal';
import { 
  MapPin, 
  Star, 
  ChefHat, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Home,
  MessageCircle,
  Calendar,
  Gift
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const MealDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const meal = mockMeals.find(m => m.id === id);
  const [bookingStatus, setBookingStatus] = useState<'none' | 'pending' | 'confirmed'>('none');
  const [translatedTitle, setTranslatedTitle] = useState(meal?.title || '');
  const [translatedDescription, setTranslatedDescription] = useState(meal?.description || '');
  const [chatOpen, setChatOpen] = useState(false);
  
  // Mock chef preferences (in real app from database)
  let identityReveal: 'real_name' | 'nickname' = 'nickname';
  let handoverMode: 'pickup_box' | 'neighbor_plate' | 'ghost_mode' | 'dine_in' = 'pickup_box';
  const chefNickname = "FoodieChef";
  const chefRealName = "Maria Schmidt";
  
  // Assign different reveal modes for different meals
  if (meal?.id === 'meal_101') {
    identityReveal = 'nickname';
    handoverMode = 'ghost_mode';
  } else if (meal?.id === 'meal_102') {
    identityReveal = 'real_name';
    handoverMode = 'dine_in';
  } else {
    identityReveal = 'nickname';
    handoverMode = 'pickup_box';
  }
  
  const collectionWindow = { start: '17:00', end: '19:00' };
  const pickupInstructions = 'Look for blue box at entrance';

  // Mock user allergens
  const userAllergens = ['gluten', 'nuts'];
  // Mock meal allergens (in real app from database)
  const mealAllergens = meal?.id === 'meal_101' ? ['dairy'] : ['gluten'];
  const matchingAllergens = checkAllergenMatch(mealAllergens, userAllergens);

  // Mock exchange mode
  const exchangeMode = meal?.id === 'meal_103' ? 'barter' : 'money';
  const barterRequests = ['White Wine', 'Dessert'];

  if (!meal) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Meal not found</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Back to Feed
          </Button>
        </div>
      </div>
    );
  }

  const handleRequestBooking = () => {
    setBookingStatus('pending');
    toast.success('Booking request sent to ' + meal.chef.firstName);
    
    // Simulate chef accepting after 2 seconds
    setTimeout(() => {
      setBookingStatus('confirmed');
      toast.success('Booking confirmed! Address revealed.');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="max-w-lg mx-auto">
        {/* Hero Image */}
        <div className="relative h-64 bg-muted">
          {meal.imageUrl ? (
            <img 
              src={meal.imageUrl} 
              alt={meal.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ChefHat className="w-20 h-20 text-muted-foreground" />
            </div>
          )}
          {meal.isCookingExperience && (
            <Badge className="absolute top-4 right-4 bg-secondary text-secondary-foreground text-sm px-3 py-1">
              Cooking Experience 🍳
            </Badge>
          )}
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Safety Alert */}
          <SafetyAlert matchingAllergens={matchingAllergens} />

          {/* Title & Chef */}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-3">{meal.title}</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {meal.chef.firstName} {meal.chef.lastName.charAt(0)}.
                  </p>
                  <div className="flex items-center gap-1 text-trust-gold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="text-sm">{meal.chef.karma} Karma</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {meal.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About this dish</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{meal.description}</p>
              {meal.allergens && meal.allergens.length > 0 && (
                <Alert className="mt-4 border-destructive/50 bg-destructive/5">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-sm">
                    <strong>Allergens:</strong> {meal.allergens.join(', ')}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Scheduled Date */}
          {meal.scheduledDate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Available On
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center">
                    <span className="text-xs font-medium text-primary">
                      {new Date(meal.scheduledDate).toLocaleDateString([], { month: 'short' }).toUpperCase()}
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {new Date(meal.scheduledDate).getDate()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {new Date(meal.scheduledDate).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(meal.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{meal.distance} from you</span>
                </div>
                <p className="font-medium text-foreground">{meal.location.neighborhood}</p>
                
                {bookingStatus === 'confirmed' ? (
                  <Alert className="border-secondary bg-secondary-light">
                    <Home className="h-4 w-4 text-secondary" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="text-foreground">
                          <strong className="text-secondary">Contact:</strong> {identityReveal === 'real_name' ? chefRealName : chefNickname}
                        </p>
                        <p className="text-foreground">
                          <strong className="text-secondary">Address:</strong> {meal.location.exactAddress}
                        </p>
                        {handoverMode === 'ghost_mode' && pickupInstructions && (
                          <p className="text-foreground">
                            <strong className="text-secondary">Instructions:</strong> {pickupInstructions}
                          </p>
                        )}
                        {collectionWindow && (
                          <p className="text-foreground">
                            <strong className="text-secondary">Collection Window:</strong> {collectionWindow.start} - {collectionWindow.end}
                          </p>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <Alert>
                      <AlertDescription className="text-sm text-muted-foreground">
                        📍 Details revealed after chef confirms your booking (privacy protection)
                      </AlertDescription>
                    </Alert>
                    <FuzzyLocationMap 
                      lat={meal.location.fuzzyLat} 
                      lng={meal.location.fuzzyLng} 
                      radius={200}
                      neighborhood={meal.location.neighborhood}
                    />
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-primary">
                    {meal.pricing.minimum === 0 ? 'Free' : `CHF ${meal.pricing.minimum}`}
                  </span>
                  <span className="text-sm text-muted-foreground">minimum</span>
                </div>
                <p className="text-sm text-muted-foreground italic">
                  💚 Pay what you want • Payment after you enjoy the meal
                </p>
                {meal.pricing.suggested && (
                  <p className="text-sm text-muted-foreground">
                    Suggested: CHF {meal.pricing.suggested}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cooking Experience Info */}
          {meal.isCookingExperience && (
            <Alert className="border-secondary bg-secondary-light">
              <ChefHat className="h-4 w-4 text-secondary" />
              <AlertDescription>
                <strong className="text-secondary">Cooking Experience Available!</strong>
                <p className="text-foreground mt-1">
                  {meal.chef.firstName} invites you to watch the cooking process and enjoy an apéro together.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Booking Action */}
          <div className="sticky bottom-20 bg-background pt-4 pb-2 border-t border-border">
            {bookingStatus === 'none' && (
              <Button 
                onClick={handleRequestBooking}
                className="w-full h-12 text-lg"
                size="lg"
              >
                Request Booking
              </Button>
            )}
            
            {bookingStatus === 'pending' && (
              <Button 
                disabled
                className="w-full h-12 text-lg"
                variant="secondary"
              >
                <Clock className="w-5 h-5 mr-2" />
                Waiting for {meal.chef.firstName}'s confirmation...
              </Button>
            )}
            
            {bookingStatus === 'confirmed' && (
              <div className="space-y-3">
                <Alert className="border-secondary bg-secondary-light">
                  <CheckCircle className="h-4 w-4 text-secondary" />
                  <AlertDescription className="text-secondary font-medium">
                    Booking confirmed! See you soon 🎉
                  </AlertDescription>
                </Alert>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => navigate(`/chat/booking-${meal.id}`)}
                    variant="outline"
                    className="flex-1 h-12 text-lg gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Chat with {meal.chef.firstName}
                  </Button>
                  <Button 
                    onClick={() => navigate(`/payment/${meal.id}`)}
                    className="flex-1 h-12 text-lg"
                  >
                    Payment
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <ChatModal 
        open={chatOpen}
        onOpenChange={setChatOpen}
        chefName={meal.chef.firstName}
        mealTitle={meal.title}
      />

      <BottomNav />
    </div>
  );
};

export default MealDetail;
