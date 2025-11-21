import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Shield } from 'lucide-react';

interface BlockUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blockedUserId: string;
  blockedUserName: string;
  currentUserId: string;
  onBlockComplete?: () => void;
}

export function BlockUserDialog({
  open,
  onOpenChange,
  blockedUserId,
  blockedUserName,
  currentUserId,
  onBlockComplete,
}: BlockUserDialogProps) {
  const { t } = useTranslation();
  const [isBlocking, setIsBlocking] = useState(false);

  const handleBlock = async () => {
    setIsBlocking(true);
    
    try {
      const { error } = await supabase
        .from('blocked_users')
        .insert({
          blocker_id: currentUserId,
          blocked_id: blockedUserId,
        });

      if (error) {
        // Handle duplicate block (user already blocked)
        if (error.code === '23505') {
          toast.info('User is already blocked');
        } else {
          throw error;
        }
      } else {
        toast.success(t('toast.user_blocked', { name: blockedUserName }));
      }

      onOpenChange(false);
      onBlockComplete?.();
    } catch (error) {
      console.error('Error blocking user:', error);
      toast.error(t('toast.block_failed'));
    } finally {
      setIsBlocking(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-background border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-destructive" />
            Block {blockedUserName}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to block this user? Once blocked:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>You won't see their meals in the feed</li>
              <li>They won't be able to send you messages</li>
              <li>You won't be able to book their meals</li>
              <li>They won't see your meals either</li>
            </ul>
            <p className="mt-2 text-sm text-muted-foreground">
              You can unblock them later from your profile settings.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isBlocking}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleBlock}
            disabled={isBlocking}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isBlocking ? 'Blocking...' : 'Block User'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
