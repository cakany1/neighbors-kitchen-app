import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const MealDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [bookingStatus, setBookingStatus] = useState<'none' | 'pending' | 'confirmed'>('none');
  const [chatOpen, setChatOpen] = useState(false);
  
  // Fetch current user
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

  // Fetch meal data with chef in a single query
  const { data: meal, isLoading } = useQuery({
    queryKey: ['meal', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meals')
        .select(`
          *,
          chef:profiles!chef_id (
            first_name,
            last_name,
            nickname,
            karma,
            display_real_name
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
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

  const matchingAllergens = checkAllergenMatch(
    meal?.allergens || [],
    currentUser?.profile?.allergens || []
  );

  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.id || !meal) throw new Error('Missing user or meal');
      
      // Check if meal is still available
      if (meal.available_portions <= 0) {
        throw new Error('This meal is sold out');
      }

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          meal_id: meal.id,
          guest_id: currentUser.id,
          status: 'pending',
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      return booking;
    },
    onSuccess: () => {
      setBookingStatus('pending');
      toast.success('Booking request sent to ' + meal?.chef?.first_name);
      queryClient.invalidateQueries({ queryKey: ['booking', id, currentUser?.id] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create booking');
    },
  });

  const handleRequestBooking = () => {
    if (!currentUser) {
      toast.error('Please log in to book this meal');
      navigate('/login');
      return;
    }
    bookingMutation.mutate();
  };

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
          {meal.scheduled_date && (
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
                <p className="font-medium text-foreground">{meal.neighborhood}</p>
                
                {bookingStatus === 'confirmed' ? (
                  <Alert className="border-secondary bg-secondary-light">
                    <Home className="h-4 w-4 text-secondary" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="text-foreground">
                          <strong className="text-secondary">Contact:</strong> {meal.chef?.first_name} {meal.chef?.last_name}
                        </p>
                        <p className="text-foreground">
                          <strong className="text-secondary">Address:</strong> {meal.exact_address}
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

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary" />
                Exchange
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Badge variant="outline" className="text-base py-1">
                  ❤️ Pay what you want
                </Badge>
                {meal.pricing_suggested && (
                  <p className="text-sm text-muted-foreground">
                    ~ Restaurant Value: CHF {meal.pricing_suggested}.-
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

          {/* Available Portions */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">Available Portions</span>
            <span className="text-lg font-semibold text-foreground">{meal.available_portions}</span>
          </div>
        </div>
      </main>

      {/* Action Button */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border">
        <div className="max-w-lg mx-auto flex gap-2">
          <Button
            variant="outline"
            onClick={() => setChatOpen(true)}
            className="flex-1"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Ask Chef
          </Button>
          
          {bookingStatus === 'none' && (
            <Button
              onClick={handleRequestBooking}
              disabled={meal.available_portions === 0 || bookingMutation.isPending}
              className="flex-1"
            >
              {meal.available_portions === 0 ? 'Sold Out' : 'Request Booking'}
            </Button>
          )}
          
          {bookingStatus === 'pending' && (
            <Button disabled className="flex-1">
              <Clock className="w-4 h-4 mr-2" />
              Pending...
            </Button>
          )}
          
          {bookingStatus === 'confirmed' && (
            <Button className="flex-1 bg-secondary">
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirmed
            </Button>
          )}
        </div>
      </div>

      <BottomNav />
      <ChatModal 
        open={chatOpen} 
        onOpenChange={setChatOpen} 
        chefName={meal.chef?.first_name || 'Chef'}
        mealTitle={meal.title}
      />
    </div>
  );
};

export default MealDetail;
