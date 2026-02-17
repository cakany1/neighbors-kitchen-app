import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Users, Mail, Check, X, Loader2, ChevronDown, UserPlus, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface HouseholdLinkingProps {
  userId: string;
  userEmail: string;
}

interface HouseholdLink {
  id: string;
  requester_id: string;
  invitee_email: string;
  invitee_id: string | null;
  requester_confirmed: boolean;
  invitee_confirmed: boolean;
  status: string;
  created_at: string;
  confirmed_at: string | null;
}

export const HouseholdLinking = ({ userId, userEmail }: HouseholdLinkingProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState('');
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [pendingConfirmId, setPendingConfirmId] = useState<string | null>(null);

  // Fetch all household links for this user
  const { data: householdLinks, isLoading } = useQuery({
    queryKey: ['householdLinks', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('household_links')
        .select('*')
        .or(`requester_id.eq.${userId},invitee_id.eq.${userId},invitee_email.eq.${userEmail}`)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as HouseholdLink[];
    },
    enabled: !!userId && !!userEmail,
  });

  // Fetch profile names for linked users
  const { data: linkedProfiles } = useQuery({
    queryKey: ['linkedProfiles', householdLinks],
    queryFn: async () => {
      if (!householdLinks?.length) return {};

      const userIds = new Set<string>();
      householdLinks.forEach(link => {
        userIds.add(link.requester_id);
        if (link.invitee_id) userIds.add(link.invitee_id);
      });

      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, nickname, avatar_url')
        .in('id', Array.from(userIds));

      if (error) throw error;

      const profileMap: Record<string, { name: string; avatar_url: string | null }> = {};
      data?.forEach(profile => {
        profileMap[profile.id] = {
          name: profile.nickname || profile.first_name,
          avatar_url: profile.avatar_url
        };
      });
      return profileMap;
    },
    enabled: !!householdLinks?.length,
  });

  // Pre-translate all messages to avoid scope issues in async functions
  const messages = {
    alreadyInvited: t('household.already_invited'),
    cannotInviteSelf: t('household.cannot_invite_self'),
    inviteSent: t('household.invite_sent'),
    inviteFailed: t('household.invite_failed'),
    linkConfirmed: t('household.link_confirmed'),
    confirmFailed: t('household.confirm_failed'),
    linkDeclined: t('household.link_declined'),
    declineFailed: t('household.decline_failed'),
    linkCancelled: t('household.link_cancelled'),
    cancelFailed: t('household.cancel_failed'),
  };

  // Create invitation mutation
  const createInviteMutation = useMutation({
    mutationFn: async (email: string) => {
      // First check if link already exists
      const { data: existing } = await supabase
        .from('household_links')
        .select('id')
        .eq('requester_id', userId)
        .eq('invitee_email', email.toLowerCase())
        .maybeSingle();

      if (existing) {
        throw new Error(messages.alreadyInvited);
      }

      // Check if the email is not the user's own
      if (email.toLowerCase() === userEmail.toLowerCase()) {
        throw new Error(messages.cannotInviteSelf);
      }

      const { error } = await supabase
        .from('household_links')
        .insert({
          requester_id: userId,
          invitee_email: email.toLowerCase(),
          requester_confirmed: true, // Requester confirms by sending
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(messages.inviteSent);
      setInviteEmail('');
      setConfirmationChecked(false);
      queryClient.invalidateQueries({ queryKey: ['householdLinks'] });
    },
    onError: (error: any) => {
      toast.error(error.message || messages.inviteFailed);
    },
  });

  // Confirm link mutation (for invitee)
  const confirmLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      // First update invitee_id if not set
      const { data: link } = await supabase
        .from('household_links')
        .select('*')
        .eq('id', linkId)
        .single();

      if (!link) throw new Error('Link not found');

      const updates: any = {
        invitee_confirmed: true,
      };

      // Set invitee_id if accepting an invitation by email
      if (!link.invitee_id && link.invitee_email === userEmail.toLowerCase()) {
        updates.invitee_id = userId;
      }

      const { error } = await supabase
        .from('household_links')
        .update(updates)
        .eq('id', linkId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(messages.linkConfirmed);
      setPendingConfirmId(null);
      queryClient.invalidateQueries({ queryKey: ['householdLinks'] });
    },
    onError: (error: any) => {
      toast.error(error.message || messages.confirmFailed);
    },
  });

  // Decline link mutation
  const declineLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase
        .from('household_links')
        .update({ status: 'declined' })
        .eq('id', linkId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(messages.linkDeclined);
      queryClient.invalidateQueries({ queryKey: ['householdLinks'] });
    },
    onError: (error: any) => {
      toast.error(error.message || messages.declineFailed);
    },
  });

  // Cancel link mutation
  const cancelLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase
        .from('household_links')
        .update({ status: 'cancelled' })
        .eq('id', linkId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(messages.linkCancelled);
      queryClient.invalidateQueries({ queryKey: ['householdLinks'] });
    },
    onError: (error: any) => {
      toast.error(error.message || messages.cancelFailed);
    },
  });

  const handleInvite = () => {
    if (!inviteEmail || !confirmationChecked) return;
    createInviteMutation.mutate(inviteEmail);
  };

  // Separate links by status and role
  const pendingInvites = householdLinks?.filter(
    link => link.status === 'pending' && link.requester_id === userId
  ) || [];

  const pendingRequests = householdLinks?.filter(
    link => link.status === 'pending' && 
    (link.invitee_id === userId || link.invitee_email === userEmail.toLowerCase()) &&
    link.requester_id !== userId
  ) || [];

  const activeLinks = householdLinks?.filter(
    link => link.status === 'active'
  ) || [];

  const getDisplayName = (link: HouseholdLink, isRequester: boolean) => {
    if (isRequester) {
      return linkedProfiles?.[link.requester_id]?.name || t('household.unknown_user');
    }
    if (link.invitee_id && linkedProfiles?.[link.invitee_id]) {
      return linkedProfiles[link.invitee_id].name;
    }
    return link.invitee_email;
  };

  return (
    <Collapsible className="mb-6">
      <Card>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              {t('household.title')}
              {activeLinks.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeLinks.length}
                </Badge>
              )}
              {pendingRequests.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {pendingRequests.length} {t('household.new')}
                </Badge>
              )}
            </CardTitle>
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
            <p className="text-sm text-muted-foreground">
              {t('household.description')}
            </p>

            {/* Pending Requests (Invitations to this user) */}
            {pendingRequests.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {t('household.pending_requests')}
                </Label>
                {pendingRequests.map((link) => (
                  <Alert key={link.id} className="border-primary/30 bg-primary/5">
                    <AlertDescription>
                      <div className="flex flex-col gap-3">
                        <p className="text-sm">
                          <strong>{getDisplayName(link, true)}</strong> {t('household.wants_to_link')}
                        </p>
                        
                        {pendingConfirmId === link.id ? (
                          <div className="space-y-3">
                            <div className="flex items-start gap-2">
                              <Checkbox
                                id={`confirm-${link.id}`}
                                checked={confirmationChecked}
                                onCheckedChange={(checked) => setConfirmationChecked(!!checked)}
                              />
                              <label
                                htmlFor={`confirm-${link.id}`}
                                className="text-xs leading-tight cursor-pointer"
                              >
                                {t('household.confirm_checkbox')}
                              </label>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => confirmLinkMutation.mutate(link.id)}
                                disabled={!confirmationChecked || confirmLinkMutation.isPending}
                              >
                                {confirmLinkMutation.isPending ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                                {t('household.confirm')}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setPendingConfirmId(null);
                                  setConfirmationChecked(false);
                                }}
                              >
                                {t('household.back')}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => setPendingConfirmId(link.id)}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              {t('household.accept')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => declineLinkMutation.mutate(link.id)}
                              disabled={declineLinkMutation.isPending}
                            >
                              <X className="w-4 h-4 mr-1" />
                              {t('household.decline')}
                            </Button>
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {/* Active Links */}
            {activeLinks.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  {t('household.active_links')}
                </Label>
                {activeLinks.map((link) => {
                  const isRequester = link.requester_id === userId;
                  const otherUserId = isRequester ? link.invitee_id : link.requester_id;
                  const otherUserName = getDisplayName(link, !isRequester);

                  return (
                    <div
                      key={link.id}
                      className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                          <Users className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{otherUserName}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('household.linked_since')} {new Date(link.confirmed_at!).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {t('household.verified')}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pending Invites Sent */}
            {pendingInvites.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  {t('household.pending_invites')}
                </Label>
                {pendingInvites.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{link.invitee_email}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('household.waiting_confirmation')}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => cancelLinkMutation.mutate(link.id)}
                      disabled={cancelLinkMutation.isPending}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Invite New Member */}
            <div className="space-y-3 pt-4 border-t border-border">
              <Label className="text-sm font-medium flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                {t('household.invite_member')}
              </Label>
              
              <div className="space-y-3">
                <Input
                  type="email"
                  placeholder={t('household.email_placeholder')}
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />

                <div className="flex items-start gap-2">
                  <Checkbox
                    id="household-confirm"
                    checked={confirmationChecked}
                    onCheckedChange={(checked) => setConfirmationChecked(!!checked)}
                  />
                  <label
                    htmlFor="household-confirm"
                    className="text-xs leading-tight cursor-pointer"
                  >
                    {t('household.invite_checkbox')}
                  </label>
                </div>

                <Button
                  onClick={handleInvite}
                  disabled={!inviteEmail || !confirmationChecked || createInviteMutation.isPending}
                  className="w-full"
                >
                  {createInviteMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-2" />
                  )}
                  {t('household.send_invite')}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                {t('household.optional_note')}
              </p>
            </div>

            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
