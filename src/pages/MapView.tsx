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

const MapView = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Fetch meals from Supabase
  const { data: meals = [] } = useQuery({
    queryKey: ['mapMeals'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('meals')
        .select(`
          *,
          chef:profiles!chef_id(id, first_name, last_name, nickname, karma)
        `)
        .gte('scheduled_date', today)
        .gt('available_portions', 0)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;

      // Transform to Meal type with location structure
      return (data || []).map((meal: any) => ({
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
          ← Zurück zum Feed
        </Button>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Mahlzeiten in der Nähe
          </h2>
          <Alert className="border-primary/20 bg-primary/10">
            <MapPin className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              <strong>Privatsphäre zuerst:</strong> Standorte werden als ungefähre Bereiche angezeigt. 
              Genaue Adressen werden erst nach Buchungsbestätigung angezeigt.
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
