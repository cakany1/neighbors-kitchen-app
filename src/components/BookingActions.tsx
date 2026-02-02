import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { UserX, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface BookingActionsProps {
  bookingId: string;
  mealId: string;
  currentStatus: string;
  isChef: boolean;
  guestId?: string;
}

export const BookingActions = ({ 
  bookingId, 
  mealId, 
  currentStatus, 
  isChef,
  guestId 
}: BookingActionsProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showNoShowDialog, setShowNoShowDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // No-show mutation (for chefs)
  const noShowMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'no_show' })
        .eq('id', bookingId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t('booking.no_show_marked'));
      queryClient.invalidateQueries({ queryKey: ['booking'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['meal', mealId] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to mark no-show');
    },
  });

  // Chef cancel mutation
  const chefCancelMutation = useMutation({
    mutationFn: async () => {
      // Update booking status
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled_by_chef' })
        .eq('id', bookingId);
      
      if (error) throw error;

      // Restore the portion - fetch current and increment
      const { data: currentMeal } = await supabase
        .from('meals')
        .select('available_portions')
        .eq('id', mealId)
        .single();
      
      if (currentMeal) {
        await supabase
          .from('meals')
          .update({ 
            available_portions: (currentMeal.available_portions || 0) + 1
          })
          .eq('id', mealId);
      }
    },
    onSuccess: () => {
      toast.success(t('booking.cancelled_by_chef'));
      queryClient.invalidateQueries({ queryKey: ['booking'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['meal', mealId] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to cancel booking');
    },
  });

  // Don't show actions for already completed/cancelled bookings
  if (['completed', 'cancelled', 'cancelled_by_chef', 'no_show'].includes(currentStatus)) {
    if (currentStatus === 'no_show') {
      return (
        <Badge variant="destructive" className="text-xs">
          <UserX className="w-3 h-3 mr-1" />
          No-Show
        </Badge>
      );
    }
    if (currentStatus === 'cancelled_by_chef') {
      return (
        <Badge variant="outline" className="text-xs border-destructive text-destructive">
          <XCircle className="w-3 h-3 mr-1" />
          {t('booking.chef_cancelled')}
        </Badge>
      );
    }
    return null;
  }

  // Only show actions for confirmed bookings
  if (currentStatus !== 'confirmed' && currentStatus !== 'pending') {
    return null;
  }

  return (
    <>
      {isChef && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNoShowDialog(true)}
            className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <UserX className="w-4 h-4 mr-1" />
            {t('booking.no_show')}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCancelDialog(true)}
          >
            <XCircle className="w-4 h-4 mr-1" />
            {t('booking.cancel_by_chef')}
          </Button>
        </div>
      )}

      {/* No-Show Confirmation Dialog */}
      <AlertDialog open={showNoShowDialog} onOpenChange={setShowNoShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('booking.no_show')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('booking.no_show_confirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => noShowMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {noShowMutation.isPending ? t('common.loading') : t('booking.no_show')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Chef Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('booking.cancel_by_chef')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('booking.cancel_chef_confirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => chefCancelMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {chefCancelMutation.isPending ? t('common.loading') : t('booking.cancel_by_chef')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};