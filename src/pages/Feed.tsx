import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MealCard } from '@/components/MealCard';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Shield, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { getDistance } from '@/utils/distance';
import { OnboardingTour } from '@/components/OnboardingTour';
import { toast } from 'sonner';

const Feed = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isGuestMode = searchParams.get('guest') === 'true';
  const [showDisclaimer, setShowDisclaimer] = useState(() => {
    return !localStorage.getItem('disclaimerSeen');
  });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);

  // Fetch current user for allergens
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      if (isGuestMode) return null; // Skip auth check in guest mode
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      return { ...user, profile };
    },
  });

  // Check if user just registered or logged in (show onboarding tour)
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('tour_completed');
    const justRegistered = localStorage.getItem('just_registered');
    
    if (currentUser && !isGuestMode) {
      // Force show tour if user just registered
      if (justRegistered === 'true') {
        localStorage.removeItem('just_registered');
        localStorage.removeItem('tour_completed'); // Reset tour flag
        setTimeout(() => setShowOnboarding(true), 500);
      } else if (!hasSeenTour) {
        // Show tour for first-time users
        setTimeout(() => setShowOnboarding(true), 500);
      }
    }
  }, [currentUser, isGuestMode]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    localStorage.setItem('tour_completed', 'true');
  };

  // Fetch meals from database with chef data AND coordinates in a single query
  const { data: meals, isLoading } = useQuery({
    queryKey: ['meals', currentUser?.id],
    queryFn: async () => {
      // First, get blocked users list for the current user
      let blockedUserIds: string[] = [];
      let usersWhoBlockedMe: string[] = [];
      
      if (currentUser?.id) {
        // Get users that current user has blocked
        const { data: blockedByMe } = await supabase
          .from('blocked_users')
          .select('blocked_id')
          .eq('blocker_id', currentUser.id);
        
        if (blockedByMe) {
          blockedUserIds = blockedByMe.map(b => b.blocked_id);
        }
        
        // Get users who have blocked the current user (reciprocal blocking)
        const { data: blockedMe } = await supabase
          .from('blocked_users')
          .select('blocker_id')
          .eq('blocked_id', currentUser.id);
        
        if (blockedMe) {
          usersWhoBlockedMe = blockedMe.map(b => b.blocker_id);
        }
      }
      
      const allBlockedUsers = [...blockedUserIds, ...usersWhoBlockedMe];
      
      // Build the query - SECURITY: Only select public fields, exclude exact_address
      let query = supabase
        .from('meals')
        .select(`
          id,
          title,
          description,
          image_url,
          chef_id,
          fuzzy_lat,
          fuzzy_lng,
          neighborhood,
          tags,
          allergens,
          available_portions,
          pricing_minimum,
          pricing_suggested,
          is_cooking_experience,
          scheduled_date,
          created_at,
          updated_at,
          handover_mode,
          collection_window_start,
          collection_window_end,
          arrival_time,
          max_seats,
          booked_seats,
          unit_type,
          exchange_mode,
          barter_requests,
          restaurant_reference_price,
          estimated_restaurant_value,
          ingredients,
          is_stock_photo,
          women_only,
          chef:profiles!chef_id (
            first_name,
            last_name,
            nickname,
            karma,
            latitude,
            longitude,
            id_verified,
            phone_verified
          )
        `)
        .order('created_at', { ascending: false });
      
      // Filter out meals from blocked users if there are any
      if (allBlockedUsers.length > 0) {
        query = query.not('chef_id', 'in', `(${allBlockedUsers.join(',')})`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
  });

  const userAllergens = currentUser?.profile?.allergens || [];
  const userLat = currentUser?.profile?.latitude;
  const userLon = currentUser?.profile?.longitude;
  const userRadius = currentUser?.profile?.notification_radius || 5000; // Default 5km

  // Calculate distances, filter by radius, and sort
  const filteredAndSortedMeals = useMemo(() => {
    if (!meals) return [];

    // If user has no location, show all meals
    if (!userLat || !userLon) {
      return meals;
    }

    // Calculate distance for each meal
    const mealsWithDistance = meals
      .map((meal) => {
        const chefLat = meal.chef?.latitude;
        const chefLon = meal.chef?.longitude;

        // If chef has no coordinates, skip this meal
        if (!chefLat || !chefLon) {
          return null;
        }

        const distance = getDistance(userLat, userLon, chefLat, chefLon);

        return {
          ...meal,
          calculatedDistance: distance,
        };
      })
      .filter((meal): meal is NonNullable<typeof meal> => meal !== null);

    // Filter by notification radius
    const withinRadius = mealsWithDistance.filter(
      (meal) => meal.calculatedDistance <= userRadius
    );

    // Smart Fallback: If no meals within radius, show 5 most recent meals from anywhere
    if (withinRadius.length === 0 && mealsWithDistance.length > 0) {
      const fallbackMeals = mealsWithDistance
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
      
      // Show toast to inform user
      if (fallbackMeals.length > 0) {
        setTimeout(() => {
          toast.info('Keine Treffer in der Nähe – hier sind Angebote aus ganz Basel.', { duration: 5000 });
        }, 500);
      }
      
      return fallbackMeals;
    }

    // Sort by distance (nearest first)
    return withinRadius.sort((a, b) => a.calculatedDistance - b.calculatedDistance);
  }, [meals, userLat, userLon, userRadius]);

  const handleDismissDisclaimer = () => {
    localStorage.setItem('disclaimerSeen', 'true');
    setShowDisclaimer(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="max-w-lg mx-auto px-4 py-6">
        {showDisclaimer && (
          <Alert className="mb-6 border-primary bg-primary-light" onClick={handleDismissDisclaimer}>
            <AlertCircle className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm text-foreground">
              <strong>Welcome to Neighbors Kitchen!</strong> This is a private food-sharing community. 
              Please bring your own container, respect chef's homes, and pay fairly. Tap to dismiss.
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">Available Meals</h2>
          <p className="text-muted-foreground">
            Fresh home-cooked meals from your neighbors
            {userLat && userLon && ` (within ${userRadius / 1000}km)`}
          </p>
        </div>

        {!userLat || !userLon ? (
          <Alert className="mb-6 border-warning bg-warning/10">
            <AlertCircle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-sm">
              <strong>{t('feed.set_location')}</strong> {t('feed.set_location_desc')}
            </AlertDescription>
          </Alert>
        ) : null}

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">{t('feed.loading_meals')}</p>
          </div>
        ) : !meals || meals.length === 0 ? (
          <div className="space-y-4">
            <Alert className="border-primary/50 bg-primary/5">
              <AlertCircle className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                <strong>📍 Beispiel-Vorschau / Demo Preview</strong><br />
                Noch keine echten Gerichte verfügbar. Hier siehst du 3 Beispiel-Angebote, wie die App aussehen wird.
              </AlertDescription>
            </Alert>
            <div className="grid gap-4">
              {[
                {
                  id: 'demo-1',
                  title: 'Hausgemachte Lasagne',
                  description: 'Klassische italienische Lasagne mit Ragu Bolognese und Béchamelsauce',
                  chef: { firstName: 'Maria', lastName: 'R.', karma: 280, isVerified: true },
                  location: { neighborhood: 'St. Johann', fuzzyLat: 47.5596, fuzzyLng: 7.5886 },
                  tags: ['Italienisch', 'Vegetarisch'],
                  imageUrl: '/placeholder-meal-1.jpg',
                  pricing: { minimum: 0, suggested: 18 },
                  isCookingExperience: false,
                  availablePortions: 4,
                  allergens: ['Milch/Laktose', 'Gluten (Getreide)', 'Eier'],
                  scheduledDate: new Date().toISOString(),
                },
                {
                  id: 'demo-2',
                  title: 'Thai Red Curry',
                  description: 'Scharfes Curry mit Kokosmilch, Gemüse und Basmatireis',
                  chef: { firstName: 'Siri', lastName: 'K.', karma: 450, isVerified: true },
                  location: { neighborhood: 'Gundeldingen', fuzzyLat: 47.5416, fuzzyLng: 7.5894 },
                  tags: ['Thailändisch', 'Vegan', 'Scharf'],
                  imageUrl: '/placeholder-meal-2.jpg',
                  pricing: { minimum: 0, suggested: 15 },
                  isCookingExperience: true,
                  availablePortions: 2,
                  allergens: ['Soja'],
                  scheduledDate: new Date().toISOString(),
                },
                {
                  id: 'demo-3',
                  title: 'Schweizer Zopf (frisch gebacken)',
                  description: 'Traditioneller Sonntagszopf aus Schweizer Mehl, noch warm vom Ofen',
                  chef: { firstName: 'Hans', lastName: 'M.', karma: 190, isVerified: false },
                  location: { neighborhood: 'Kleinbasel', fuzzyLat: 47.5667, fuzzyLng: 7.5953 },
                  tags: ['Schweiz', 'Frühstück', 'Hausgemacht'],
                  imageUrl: '/placeholder-meal-3.jpg',
                  pricing: { minimum: 0, suggested: 8 },
                  isCookingExperience: false,
                  availablePortions: 1,
                  allergens: ['Gluten (Getreide)', 'Milch/Laktose', 'Eier'],
                  scheduledDate: new Date().toISOString(),
                },
              ].map((meal) => (
                <MealCard 
                  key={meal.id} 
                  meal={meal}
                  onClick={() => {
                    toast.info('Dies ist ein Demo-Gericht. Registriere dich, um echte Angebote zu sehen!');
                  }}
                  userAllergens={userAllergens}
                />
              ))}
            </div>
          </div>
        ) : filteredAndSortedMeals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {t('feed.no_meals_radius', { radius: userRadius / 1000 })}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredAndSortedMeals.map((meal) => (
              <MealCard 
                key={meal.id} 
                meal={{
                  id: meal.id,
                  title: isGuestMode ? meal.title.split(' ').map((_, i) => i < 2 ? '█████' : _).join(' ') : meal.title,
                  description: isGuestMode ? meal.description.slice(0, 50) + '...' : meal.description,
                  chef: {
                    firstName: meal.chef?.first_name || 'Chef',
                    lastName: meal.chef?.last_name || '',
                    karma: meal.chef?.karma || 0,
                    isVerified: meal.chef?.id_verified || meal.chef?.phone_verified || false,
                  },
                    location: {
                      neighborhood: meal.neighborhood,
                      fuzzyLat: parseFloat(String(meal.fuzzy_lat)),
                      fuzzyLng: parseFloat(String(meal.fuzzy_lng)),
                    },
                  distance: 'calculatedDistance' in meal ? (meal as any).calculatedDistance as number : undefined,
                  tags: meal.tags || [],
                  imageUrl: meal.image_url || undefined,
                  pricing: {
                    minimum: meal.pricing_minimum || 0,
                    suggested: meal.pricing_suggested || undefined,
                  },
                  isCookingExperience: meal.is_cooking_experience,
                  availablePortions: meal.available_portions,
                  allergens: meal.allergens || [],
                  scheduledDate: meal.scheduled_date,
                }}
                onClick={() => {
                  if (isGuestMode) {
                    setShowGuestModal(true);
                  } else {
                    navigate(`/meal/${meal.id}`);
                  }
                }}
                userAllergens={userAllergens}
              />
            ))}
          </div>
        )}
      </main>

      <BottomNav />

      {/* Onboarding Tour */}
      {showOnboarding && <OnboardingTour onComplete={handleOnboardingComplete} />}

      {/* Guest Mode Modal */}
      <Dialog open={showGuestModal} onOpenChange={setShowGuestModal}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <Lock className="w-12 h-12 text-primary" />
            </div>
            <DialogTitle className="text-center text-2xl">
              Registriere dich, um dieses Essen zu retten!
            </DialogTitle>
            <DialogDescription className="text-center">
              Du browsst gerade als Gast. Um Mahlzeiten zu buchen und mit Köchen zu chatten, 
              musst du dich registrieren.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button onClick={() => navigate('/signup')} size="lg">
              Jetzt registrieren
            </Button>
            <Button variant="outline" onClick={() => navigate('/login')} size="lg">
              Ich habe bereits einen Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Feed;
