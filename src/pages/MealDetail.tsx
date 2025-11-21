import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
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
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const MealDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [bookingStatus, setBookingStatus] = useState<'none' | 'pending' | 'confirmed'>('none');
  const [chatOpen, setChatOpen] = useState(false);
  const [bookingQuantity, setBookingQuantity] = useState(1);
  
  // Fetch current user - SECURITY: Own profile can access all fields
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      // User can access their own full profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      return { ...user, profile };
    },
  });

  // Fetch meal data with chef - SECURITY: Never fetch exact_address here
  const { data: meal, isLoading } = useQuery({
    queryKey: ['meal', id],
    queryFn: async () => {
      const { data, error } = await supabase
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
            display_real_name,
            id_verified,
            phone_verified
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // SECURITY: Only fetch exact address AFTER booking is confirmed
  const { data: confirmedAddress } = useQuery({
    queryKey: ['mealAddress', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meals')
        .select('exact_address')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: bookingStatus === 'confirmed',
  });

  // Fetch existing booking if any
  const { data: existingBooking } = useQuery({
    queryKey: ['booking', id, currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return null;
      
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('meal_id', id)
        .eq('guest_id', currentUser.id)
        .maybeSingle();
      
      return data;
    },
    enabled: !!currentUser?.id,
  });

  // Update booking status when existingBooking changes
  useEffect(() => {
    if (existingBooking) {
      if (existingBooking.status === 'confirmed') {
        setBookingStatus('confirmed');
      } else if (existingBooking.status === 'pending') {
        setBookingStatus('pending');
      }
    }
  }, [existingBooking]);

  // Set default quantity for couples
  useEffect(() => {
    if (currentUser?.profile?.is_couple) {
      setBookingQuantity(2);
    }
  }, [currentUser?.profile?.is_couple]);

  const matchingAllergens = checkAllergenMatch(
    meal?.allergens || [],
    currentUser?.profile?.allergens || []
  );

  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.id || !meal) throw new Error('Missing user or meal');

      // BOOKING GATE: Check profile completion
      const profile = currentUser.profile;
      const isProfileComplete = 
        profile?.phone_number && 
        profile?.private_address && 
        profile?.private_city;

      if (!isProfileComplete) {
        toast.error(t('toast.profile_incomplete'));
        navigate('/profile');
        throw new Error('Profile incomplete');
      }

      // Call secure booking function (prevents overbooking with row-level lock)
      const { data, error } = await supabase.rpc('book_meal', {
        p_meal_id: meal.id,
        p_guest_id: currentUser.id,
      });

      if (error) throw error;

      // Type the response
      const result = data as { success: boolean; message?: string; booking_id?: string };

      // Check function response
      if (!result.success) {
        throw new Error(result.message || 'Booking failed');
      }

      return result;
    },
    onSuccess: () => {
      setBookingStatus('pending');
      toast.success(t('toast.booking_sent', { name: meal?.chef?.first_name || '' }));
      // Refresh meal data to show updated portion count
      queryClient.invalidateQueries({ queryKey: ['meal', id] });
      queryClient.invalidateQueries({ queryKey: ['booking', id, currentUser?.id] });
    },
    onError: (error: any) => {
      toast.error(error.message || t('toast.booking_failed'));
    },
  });

  const handleRequestBooking = () => {
    if (!currentUser) {
      toast.error('Please log in to book this meal');
      navigate('/login');
      return;
    }

    // DEMO LOCK: Prevent booking demo meals
    if (meal?.tags?.includes('Demo / Beispiel')) {
      toast.info('👋 Dies ist nur ein Demo-Eintrag. Du kannst ihn nicht wirklich buchen, aber probier es gerne aus!', {
        duration: 5000,
      });
      return;
    }
    
    bookingMutation.mutate();
  };

  // Cancel booking mutation
  const cancelBookingMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.id || !existingBooking?.id) throw new Error('Missing data');

      const { data, error } = await supabase.rpc('cancel_booking', {
        p_booking_id: existingBooking.id,
        p_guest_id: currentUser.id,
      });

      if (error) throw error;

      const result = data as { success: boolean; message?: string };

      if (!result.success) {
        throw new Error(result.message || 'Cancellation failed');
      }

      return result;
    },
    onSuccess: () => {
      setBookingStatus('none');
      toast.success(t('toast.booking_cancelled'));
      // Refresh queries
      queryClient.invalidateQueries({ queryKey: ['meal', id] });
      queryClient.invalidateQueries({ queryKey: ['booking', id, currentUser?.id] });
    },
    onError: (error: any) => {
      toast.error(error.message || t('toast.cancel_failed'));
    },
  });

  const handleCancelBooking = () => {
    if (window.confirm('Möchtest du diese Buchung wirklich stornieren?')) {
      cancelBookingMutation.mutate();
    }
  };

  // Calculate if booking is within 15-minute grace period
  const isWithinCancellationPeriod = existingBooking
    ? (Date.now() - new Date(existingBooking.created_at).getTime()) < 15 * 60 * 1000
    : false;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="max-w-lg mx-auto">
        {/* Hero Image */}
        <div className="relative h-64 bg-muted">
          {meal.image_url ? (
            <img 
              src={meal.image_url} 
              alt={meal.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ChefHat className="w-20 h-20 text-muted-foreground" />
            </div>
          )}
          {meal.is_stock_photo && (
            <Badge className="absolute top-3 right-3 bg-background/80 backdrop-blur">
              📷 Symbolic Image
            </Badge>
          )}
        </div>

        <div className="p-4 space-y-4">
          {/* Title & Chef */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-foreground">{meal.title}</h1>
                <TranslateButton 
                  originalText={meal.title}
                  onTranslate={(translated) => {}}
                />
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <ChefHat className="w-4 h-4" />
                <span>by {meal.chef?.first_name} {meal.chef?.last_name?.charAt(0)}.</span>
                <Star className="w-4 h-4 fill-trust-gold text-trust-gold" />
                <span className="text-trust-gold font-semibold">{meal.chef?.karma || 0}</span>
              </div>
            </div>
          </div>

          {/* Safety Alert */}
          {matchingAllergens.length > 0 && (
            <SafetyAlert matchingAllergens={matchingAllergens} />
          )}

          {/* Cooking Experience Badge */}
          {meal.is_cooking_experience && (
            <Alert className="border-primary bg-primary/5">
              <Home className="h-4 w-4 text-primary" />
              <AlertDescription>
                🍽️ <strong>Cooking Experience</strong> - Watch and socialize in the kitchen!
              </AlertDescription>
            </Alert>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {meal.tags?.map((tag: string) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Beschreibung */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Über dieses Gericht</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{meal.description}</p>
              {meal.allergens && meal.allergens.length > 0 && (
                <Alert className="mt-4 border-destructive/50 bg-destructive/5">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-sm">
                    <strong>Allergene:</strong> {meal.allergens.join(', ')}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Geplantes Datum */}
          {meal.scheduled_date && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Verfügbar am
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center">
                    <span className="text-xs font-medium text-primary">
                      {new Date(meal.scheduled_date).toLocaleDateString([], { month: 'short' }).toUpperCase()}
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {new Date(meal.scheduled_date).getDate()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {new Date(meal.scheduled_date).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Standort */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Standort
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium text-foreground">{meal.neighborhood}</p>
                
                {bookingStatus === 'confirmed' ? (
                  <Alert className="border-secondary bg-secondary-light">
                    <Home className="h-4 w-4 text-secondary" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="text-foreground">
                          <strong className="text-secondary">Kontakt:</strong> {meal.chef?.first_name} {meal.chef?.last_name}
                        </p>
                         <p className="text-foreground">
                          <strong className="text-secondary">Adresse:</strong> {confirmedAddress?.exact_address}
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="mt-4">
                    <FuzzyLocationMap
                      lat={parseFloat(String(meal.fuzzy_lat))}
                      lng={parseFloat(String(meal.fuzzy_lng))}
                      neighborhood={meal.neighborhood}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Austausch */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary" />
                Austausch
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Badge variant="outline" className="text-base py-1">
                  ❤️ Zahl was du willst
                </Badge>
                {meal.pricing_suggested && (
                  <p className="text-sm text-muted-foreground">
                    ~ Restaurant Wert: CHF {meal.pricing_suggested}.-
                  </p>
                )}
                {meal.pricing_minimum > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Minimum: CHF {meal.pricing_minimum}.-
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Verfügbare Portionen */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">Verfügbare Portionen</span>
            <span className="text-lg font-semibold text-foreground">{meal.available_portions}</span>
          </div>

          {/* Couple Booking Selector */}
          {currentUser?.profile?.is_couple && bookingStatus === 'none' && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6 space-y-3">
                <Label className="text-sm font-semibold">Portionsanzahl</Label>
                <RadioGroup 
                  value={bookingQuantity.toString()} 
                  onValueChange={(val) => setBookingQuantity(parseInt(val))}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="2" id="couple-both" />
                    <Label htmlFor="couple-both" className="cursor-pointer flex-1">
                      👫 Für uns beide (2 Portionen)
                      <span className="block text-xs text-muted-foreground">
                        Standard für Paare
                      </span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="1" id="couple-single" />
                    <Label htmlFor="couple-single" className="cursor-pointer flex-1">
                      👤 Nur für mich (1 Portion)
                      <span className="block text-xs text-muted-foreground">
                        Für einzelne Person
                      </span>
                    </Label>
                  </div>
                </RadioGroup>
                {meal.pricing_suggested && bookingQuantity > 1 && (
                  <Alert className="bg-secondary/10 border-secondary/20">
                    <AlertDescription className="text-xs">
                      💡 Geschätzte Kosten: CHF {(meal.pricing_suggested * bookingQuantity).toFixed(2)}.- ({bookingQuantity} Portionen)
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Aktionsbuttons */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border">
        <div className="max-w-lg mx-auto flex gap-2">
          <Button
            variant="outline"
            onClick={() => setChatOpen(true)}
            className="flex-1"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Chef fragen
          </Button>
          
          {bookingStatus === 'none' && (
            <Button
              onClick={handleRequestBooking}
              disabled={meal.available_portions === 0 || bookingMutation.isPending}
              className="flex-1"
            >
              {meal.available_portions === 0 ? 'Ausverkauft' : 'Buchung anfragen'}
            </Button>
          )}
          
          {bookingStatus === 'pending' && (
            <>
              {isWithinCancellationPeriod ? (
                <Button 
                  variant="destructive"
                  onClick={handleCancelBooking}
                  disabled={cancelBookingMutation.isPending}
                  className="flex-1"
                >
                  {cancelBookingMutation.isPending ? 'Wird storniert...' : 'Buchung stornieren'}
                </Button>
              ) : (
                <Button disabled className="flex-1">
                  <Clock className="w-4 h-4 mr-2" />
                  Ausstehend...
                </Button>
              )}
            </>
          )}
          
          {bookingStatus === 'confirmed' && (
            <div className="flex-1 space-y-2">
              <Button disabled className="w-full bg-secondary">
                <CheckCircle className="w-4 h-4 mr-2" />
                Buchung bestätigt
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Kontaktiere Koch zum Stornieren
              </p>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
      <ChatModal 
        open={chatOpen} 
        onOpenChange={setChatOpen}
        chefId={meal.chef_id}
        chefName={meal.chef?.first_name || 'Chef'}
        mealId={meal.id}
        mealTitle={meal.title}
      />
    </div>
  );
};

export default MealDetail;
