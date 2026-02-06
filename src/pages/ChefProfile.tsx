import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VerificationBadge } from '@/components/VerificationBadge';
import { ReportDialog } from '@/components/ReportDialog';
import { KarmaLevel } from '@/components/KarmaLevel';
import { ProfileRatings } from '@/components/ProfileRatings';
import { Star, ChefHat, Award, Camera, ArrowLeft, Flag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { MealCard } from '@/components/MealCard';

const ChefProfile = () => {
  const { chefId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showReportDialog, setShowReportDialog] = useState(false);

  // Fetch chef profile
  const { data: chef, isLoading: chefLoading } = useQuery({
    queryKey: ['chefProfile', chefId],
    queryFn: async () => {
      // SECURITY: Use public view to avoid exposing sensitive PII
      const { data, error } = await supabase
        .from('profiles_public')
        .select('id, first_name, last_name, nickname, display_real_name, avatar_url, karma, id_verified, phone_verified, languages')
        .eq('id', chefId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch chef's meals
  const { data: meals, isLoading: mealsLoading } = useQuery({
    queryKey: ['chefMeals', chefId],
    queryFn: async () => {
      // SECURITY: Use meals_public view to prevent exact_address exposure
      const { data, error } = await supabase
        .from('meals_public')
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
          is_cooking_experience,
          scheduled_date,
          women_only,
          is_stock_photo,
          exchange_mode
        `)
        .eq('chef_id', chefId)
        .order('created_at', { ascending: false })
        .limit(12);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch gallery photos
  const { data: galleryPhotos } = useQuery({
    queryKey: ['chefGallery', chefId],
    queryFn: async () => {
      const { data, error } = await supabase
        .storage
        .from('gallery')
        .list(`${chefId}/`, {
          limit: 20,
          sortBy: { column: 'created_at', order: 'desc' }
        });
      
      if (error) throw error;
      return data || [];
    },
  });

  if (chefLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <main className="max-w-lg mx-auto px-4 py-6">
          <p className="text-center text-muted-foreground">{t('common.loading')}</p>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (!chef) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <main className="max-w-lg mx-auto px-4 py-6">
          <p className="text-center text-muted-foreground">Chef not found</p>
          <Button onClick={() => navigate('/feed')} className="mt-4 mx-auto block">
            Back to Feed
          </Button>
        </main>
        <BottomNav />
      </div>
    );
  }

  const displayName = chef.display_real_name 
    ? `${chef.first_name} ${chef.last_name}`
    : chef.nickname || chef.first_name;

  const galleryCount = galleryPhotos?.length || 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('meal_detail.back_to_feed')}
        </Button>

        {/* Chef Header Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={chef.avatar_url || undefined} alt={displayName} />
                <AvatarFallback>
                  <ChefHat className="w-8 h-8" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">{displayName}</h1>
                    <VerificationBadge 
                      isVerified={chef.id_verified || chef.phone_verified || false}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReportDialog(true)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Flag className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="mb-2">
                  <KarmaLevel karma={chef.karma || 0} size="sm" />
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-primary">{chef.karma}</span>
                    <span className="text-muted-foreground">Karma</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Camera className="w-4 h-4 text-muted-foreground" />
                    <span className="font-bold text-primary">{galleryCount}</span>
                    <span className="text-muted-foreground">Photos</span>
                  </div>
                </div>

                {/* Ratings summary */}
                <div className="mt-2">
                  <ProfileRatings userId={chefId!} compact />
                </div>

                {/* Languages */}
                {chef.languages && chef.languages.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {chef.languages.map((lang: string) => (
                      <Badge key={lang} variant="outline" className="text-xs">
                        {lang.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs: Meals & Gallery */}
        <Tabs defaultValue="meals" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="meals">
              Meals ({meals?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="gallery">
              Gallery ({galleryCount})
            </TabsTrigger>
          </TabsList>

          {/* Meals Tab */}
          <TabsContent value="meals" className="space-y-4 mt-4">
            {mealsLoading ? (
              <p className="text-center text-muted-foreground py-8">{t('common.loading')}</p>
            ) : meals && meals.length > 0 ? (
              <div className="grid gap-4">
                {meals.map((meal) => {
                  // Map database structure to Meal type
                  const mappedMeal: any = {
                    id: meal.id,
                    title: meal.title,
                    description: meal.description,
                    chef: {
                      firstName: chef.first_name,
                      lastName: chef.last_name,
                      karma: chef.karma,
                      isVerified: chef.id_verified || chef.phone_verified || false
                    },
                    location: {
                      neighborhood: meal.neighborhood,
                      fuzzyLat: meal.fuzzy_lat,
                      fuzzyLng: meal.fuzzy_lng
                    },
                    tags: meal.tags || [],
                    imageUrl: meal.image_url || '',
                    pricing: {
                      minimum: meal.pricing_minimum || 0,
                      suggested: meal.pricing_minimum || undefined
                    },
                    isCookingExperience: meal.is_cooking_experience || false,
                    availablePortions: meal.available_portions || 0,
                    allergens: meal.allergens || [],
                    scheduledDate: meal.scheduled_date
                  };
                  
                  return (
                    <MealCard 
                      key={meal.id} 
                      meal={mappedMeal}
                      onClick={() => navigate(`/meal/${meal.id}`)}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <ChefHat className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No meals shared yet</p>
              </div>
            )}
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery" className="mt-4">
            {galleryPhotos && galleryPhotos.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {galleryPhotos.map((photo) => {
                  const photoUrl = supabase.storage.from('gallery').getPublicUrl(`${chefId}/${photo.name}`).data.publicUrl;
                  return (
                    <div 
                      key={photo.name} 
                      className="aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(photoUrl, '_blank')}
                    >
                      <img 
                        src={photoUrl} 
                        alt="Gallery" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Camera className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No gallery photos yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <ReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        reportedUserId={chefId}
      />

      <Footer />
      <BottomNav />
    </div>
  );
};

export default ChefProfile;
