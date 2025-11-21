import { useState, useMemo } from 'react';
import { MealCard } from '@/components/MealCard';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { getDistance } from '@/utils/distance';

const Feed = () => {
  const navigate = useNavigate();
  const [showDisclaimer, setShowDisclaimer] = useState(() => {
    return !localStorage.getItem('disclaimerSeen');
  });

  // Fetch current user for allergens
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
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
      
      // Build the query
      let query = supabase
        .from('meals')
        .select(`
          *,
          chef:profiles!chef_id (
            first_name,
            last_name,
            nickname,
            karma,
            latitude,
            longitude
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
        {/* Verification Pending Banner */}
        {currentUser?.profile?.verification_status === 'pending' && (
          <Alert className="mb-6 border-warning bg-warning/10">
            <Shield className="h-4 w-4 text-warning" />
            <AlertDescription className="text-sm">
              <strong>Dein Profil wird gerade von unserem Team überprüft.</strong> Danke für deine Geduld! 
              Du kannst Mahlzeiten ansehen, aber noch nicht buchen oder teilen.
            </AlertDescription>
          </Alert>
        )}

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
              <strong>Set your location</strong> in Profile Settings to see meals filtered by distance.
            </AlertDescription>
          </Alert>
        ) : null}

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading meals...</p>
          </div>
        ) : !meals || meals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No meals available yet. Be the first to share!</p>
          </div>
        ) : filteredAndSortedMeals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No meals available within your {userRadius / 1000}km radius. 
              Try increasing your notification radius in Profile Settings.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredAndSortedMeals.map((meal) => (
              <MealCard 
                key={meal.id} 
                meal={{
                  id: meal.id,
                  title: meal.title,
                  description: meal.description,
                  chef: {
                    firstName: meal.chef?.first_name || 'Chef',
                    lastName: meal.chef?.last_name || '',
                    karma: meal.chef?.karma || 0,
                  },
                  location: {
                    neighborhood: meal.neighborhood,
                    fuzzyLat: parseFloat(String(meal.fuzzy_lat)),
                    fuzzyLng: parseFloat(String(meal.fuzzy_lng)),
                    exactAddress: meal.exact_address,
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
                onClick={() => navigate(`/meal/${meal.id}`)}
                userAllergens={userAllergens}
              />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Feed;
