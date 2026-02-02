import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BookingActions } from '@/components/BookingActions';
import { Calendar, User, ChefHat } from 'lucide-react';
import { format } from 'date-fns';
import { de, enUS } from 'date-fns/locale';

interface ChefBookingsProps {
  userId: string;
}

export const ChefBookings = ({ userId }: ChefBookingsProps) => {
  const { t, i18n } = useTranslation();

  // Fetch all bookings for the chef's meals
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['chef-bookings', userId],
    queryFn: async () => {
      // First get the chef's meals
      const { data: meals, error: mealsError } = await supabase
        .from('meals')
        .select('id, title, scheduled_date')
        .eq('chef_id', userId);

      if (mealsError) throw mealsError;
      if (!meals || meals.length === 0) return [];

      const mealIds = meals.map(m => m.id);

      // Then get all bookings for those meals
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, meal_id, guest_id, status, created_at, payment_amount')
        .in('meal_id', mealIds)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;
      if (!bookingsData || bookingsData.length === 0) return [];

      // Get guest profiles separately
      const guestIds = [...new Set(bookingsData.map(b => b.guest_id))];
      const { data: guests } = await supabase
        .from('profiles_public')
        .select('id, first_name, last_name, nickname, avatar_url')
        .in('id', guestIds);

      // Merge meal info with bookings
      return bookingsData.map(booking => {
        const meal = meals.find(m => m.id === booking.meal_id);
        const guest = guests?.find(g => g.id === booking.guest_id);
        return {
          ...booking,
          meal_title: meal?.title,
          meal_date: meal?.scheduled_date,
          guest,
        };
      });
    },
    enabled: !!userId,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/30">{t('booking.status_pending', 'Ausstehend')}</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/30">{t('booking.status_confirmed', 'Bestätigt')}</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/30">{t('booking.status_completed', 'Abgeschlossen')}</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-500/10 text-gray-700 border-gray-500/30">{t('booking.status_cancelled', 'Storniert')}</Badge>;
      case 'cancelled_by_chef':
        return <Badge variant="destructive">{t('booking.chef_cancelled')}</Badge>;
      case 'no_show':
        return <Badge variant="destructive">No-Show</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <ChefHat className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t('booking.no_bookings_yet', 'Noch keine Buchungen für deine Gerichte')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <Card key={booking.id} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">{booking.meal_title}</CardTitle>
              {getStatusBadge(booking.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Guest Info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {booking.guest?.avatar_url ? (
                  <img src={booking.guest.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {booking.guest?.nickname || `${booking.guest?.first_name} ${booking.guest?.last_name?.charAt(0)}.`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('booking.booked_on', 'Gebucht am')} {format(new Date(booking.created_at), 'dd.MM.yyyy', {
                    locale: i18n.language === 'en' ? enUS : de,
                  })}
                </p>
              </div>
            </div>

            {/* Meal Date */}
            {booking.meal_date && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>
                  {format(new Date(booking.meal_date), 'EEEE, d. MMMM yyyy', {
                    locale: i18n.language === 'en' ? enUS : de,
                  })}
                </span>
              </div>
            )}

            {/* Booking Actions */}
            <div className="pt-2">
              <BookingActions
                bookingId={booking.id}
                mealId={booking.meal_id}
                currentStatus={booking.status}
                isChef={true}
                guestId={booking.guest_id}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};