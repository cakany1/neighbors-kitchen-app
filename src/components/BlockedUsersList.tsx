import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Shield, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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

interface BlockedUser {
  id: string;
  blocked_id: string;
  blocked_user: {
    first_name: string;
    last_name: string;
    nickname: string | null;
  };
}

interface BlockedUsersListProps {
  currentUserId: string;
}

export function BlockedUsersList({ currentUserId }: BlockedUsersListProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [unblockUserId, setUnblockUserId] = useState<string | null>(null);

  // Fetch blocked users
  const { data: blockedUsers = [], isLoading } = useQuery({
    queryKey: ['blockedUsers', currentUserId],
    queryFn: async () => {
      // First get the blocked_users records
      const { data: blocks, error: blocksError } = await supabase
        .from('blocked_users')
        .select('id, blocked_id')
        .eq('blocker_id', currentUserId);

      if (blocksError) throw blocksError;
      if (!blocks || blocks.length === 0) return [];

      // Then get the profile details for each blocked user
      const blockedUserIds = blocks.map(b => b.blocked_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, nickname')
        .in('id', blockedUserIds);

      if (profilesError) throw profilesError;

      // Combine the data
      return blocks.map(block => ({
        id: block.id,
        blocked_id: block.blocked_id,
        blocked_user: profiles?.find(p => p.id === block.blocked_id) || {
          first_name: 'Unknown',
          last_name: 'User',
          nickname: null,
        },
      }));
    },
  });

  // Unblock user mutation
  const unblockMutation = useMutation({
    mutationFn: async (blockRecordId: string) => {
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('id', blockRecordId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t('toast.user_unblocked'));
      queryClient.invalidateQueries({ queryKey: ['blockedUsers', currentUserId] });
      queryClient.invalidateQueries({ queryKey: ['meals'] }); // Refresh feed
      setUnblockUserId(null);
    },
    onError: (error) => {
      console.error('Error unblocking user:', error);
      toast.error(t('toast.unblock_failed'));
    },
  });

  const handleUnblock = (blockRecordId: string) => {
    unblockMutation.mutate(blockRecordId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            {t('profile.blocked_title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Lädt...</p>
        </CardContent>
      </Card>
    );
  }

  const selectedBlockedUser = blockedUsers.find(u => u.id === unblockUserId);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-destructive" />
            {t('profile.blocked_title')}
          </CardTitle>
          <CardDescription>
            {t('profile.blocked_desc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {blockedUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('profile.no_blocked')}
            </p>
          ) : (
            <div className="space-y-3">
              {blockedUsers.map((blockedUser) => (
                <div
                  key={blockedUser.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 bg-destructive/10">
                      <div className="w-full h-full flex items-center justify-center text-destructive font-semibold">
                        {blockedUser.blocked_user.first_name.charAt(0)}
                      </div>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">
                        {blockedUser.blocked_user.first_name} {blockedUser.blocked_user.last_name}
                      </p>
                      {blockedUser.blocked_user.nickname && (
                        <p className="text-xs text-muted-foreground">
                          @{blockedUser.blocked_user.nickname}
                        </p>
                      )}
                    </div>
                    <Badge variant="destructive" className="ml-2">
                      {t('profile.blocked_badge')}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUnblockUserId(blockedUser.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unblock Confirmation Dialog */}
      <AlertDialog open={!!unblockUserId} onOpenChange={(open) => !open && setUnblockUserId(null)}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('profile.unblock_confirm_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('profile.unblock_confirm_desc', {
                name: selectedBlockedUser 
                  ? `${selectedBlockedUser.blocked_user.first_name} ${selectedBlockedUser.blocked_user.last_name}`
                  : ''
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unblockMutation.isPending}>
              {t('profile.unblock_cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => unblockUserId && handleUnblock(unblockUserId)}
              disabled={unblockMutation.isPending}
            >
              {unblockMutation.isPending ? t('profile.unblocking') : t('profile.unblock_action')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
