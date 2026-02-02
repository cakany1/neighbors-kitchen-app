import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import InteractiveMap from '@/components/maps/InteractiveMap';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Meal } from '@/types/meal';
import { DEMO_MEALS } from '@/data/demoMeals';

const MapView = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Fetch meals from Supabase + add demo meals
  const { data: meals = [] } = useQuery({
    queryKey: ['mapMeals'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // SECURITY: Use meals_public view to prevent exact_address exposure
      const { data, error } = await supabase
        .from('meals_public')
        .select(`
          id,
          title,
          description,
          image_url,
          fuzzy_lat,
          fuzzy_lng,
          neighborhood,
          tags,
          available_portions,
          scheduled_date,
          chef:profiles_public!chef_id(id, first_name, last_name, nickname, karma)
        `)
        .gte('scheduled_date', today)
        .gt('available_portions', 0)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;

      // Transform DB meals to Meal type with location structure
      const dbMeals = (data || []).map((meal: any) => ({
        id: meal.id,
        title: meal.title,
        description: meal.description,
        imageUrl: meal.image_url || '/placeholder-meal-1.jpg',
        chef: {
          firstName: meal.chef.first_name,
          lastName: meal.chef.last_name,
          karma: meal.chef.karma,
        },
        location: {
          fuzzyLat: meal.fuzzy_lat,
          fuzzyLng: meal.fuzzy_lng,
          neighborhood: meal.neighborhood,
        },
        distance: 0,
        pricing: {
          minimum: meal.pricing_minimum || 0,
          suggested: meal.pricing_suggested,
        },
        isCookingExperience: meal.is_cooking_experience,
        availablePortions: meal.available_portions,
        allergens: meal.allergens || [],
        tags: meal.tags || [],
        scheduledDate: meal.scheduled_date,
      })) as Meal[];

      // Transform demo meals to same format
      const safeDemoMeals = DEMO_MEALS && Array.isArray(DEMO_MEALS) ? DEMO_MEALS : [];
      const demoMealsForMap = safeDemoMeals.map((meal) => ({
        id: meal.id,
        title: meal.title,
        description: meal.description,
        imageUrl: meal.image_url || '/placeholder-meal-1.jpg',
        chef: {
          firstName: meal.chef.first_name,
          lastName: meal.chef.last_name,
          karma: meal.chef.karma,
        },
        location: {
          fuzzyLat: meal.fuzzy_lat,
          fuzzyLng: meal.fuzzy_lng,
          neighborhood: meal.neighborhood,
        },
        distance: 0,
        pricing: {
          minimum: meal.pricing_minimum || 0,
          suggested: meal.pricing_suggested,
        },
        isCookingExperience: meal.is_cooking_experience,
        availablePortions: meal.available_portions,
        allergens: meal.allergens || [],
        tags: meal.tags || [],
        scheduledDate: meal.scheduled_date,
      })) as Meal[];

      // Combine: demo meals first, then DB meals
      return [...demoMealsForMap, ...dbMeals];
    },
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="max-w-lg mx-auto px-4 py-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/app')} 
          className="mb-4"
        >
          {t('map.back_to_feed')}
        </Button>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {t('map.meals_nearby')}
          </h2>
          <Alert className="border-primary/20 bg-primary/10">
            <MapPin className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              <strong>{t('map.privacy_first')}</strong> {t('map.privacy_desc')}
            </AlertDescription>
          </Alert>
        </div>

        <div className="mb-6 h-[400px]">
          <InteractiveMap meals={meals} />
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default MapView;
