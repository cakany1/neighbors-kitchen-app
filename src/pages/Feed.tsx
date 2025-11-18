import { useState } from 'react';
import { MealCard } from '@/components/MealCard';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

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

  // Fetch meals from database
  const { data: meals, isLoading } = useQuery({
    queryKey: ['meals'],
    queryFn: async () => {
      const { data: mealsData, error: mealsError } = await supabase
        .from('meals')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (mealsError) throw mealsError;
      
      // Fetch chef profiles for all meals
      const mealsWithChefs = await Promise.all(
        mealsData.map(async (meal) => {
          const { data: chefData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', meal.chef_id)
            .single();
          
          return {
            ...meal,
            chef_profile: chefData,
          };
        })
      );
      
      return mealsWithChefs;
    },
  });

  const userAllergens = currentUser?.profile?.allergens || [];

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
          <p className="text-muted-foreground">Fresh home-cooked meals from your neighbors</p>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading meals...</p>
          </div>
        ) : !meals || meals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No meals available yet. Be the first to share!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {meals.map((meal) => (
              <MealCard 
                key={meal.id} 
                meal={{
                  id: meal.id,
                  title: meal.title,
                  description: meal.description,
                  chef: {
                    firstName: meal.chef_profile?.first_name || 'Chef',
                    lastName: meal.chef_profile?.last_name || '',
                    karma: meal.chef_profile?.karma || 0,
                  },
                  location: {
                    neighborhood: meal.neighborhood,
                    fuzzyLat: parseFloat(String(meal.fuzzy_lat)),
                    fuzzyLng: parseFloat(String(meal.fuzzy_lng)),
                    exactAddress: meal.exact_address,
                  },
                  distance: '~5 min walk', // Calculate based on user location in future
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
