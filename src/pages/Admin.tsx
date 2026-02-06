import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Shield, Users, ChefHat, Calendar, AlertCircle, CheckCircle, XCircle, ImagePlus, MessageCircleQuestion, AlertTriangle, Mail, Send, MessageSquare, Settings, Bell, BellOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';

// Helper function to check for incomplete profile fields
const getProfileWarnings = (user: {
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  phone_number?: string | null;
  gender?: string | null;
  is_couple?: boolean | null;
  partner_name?: string | null;
  partner_photo_url?: string | null;
}) => {
  const warnings: string[] = [];
  
  if (!user.first_name?.trim()) warnings.push('Vorname fehlt');
  if (!user.last_name?.trim()) warnings.push('Nachname fehlt');
  if (!user.avatar_url) warnings.push('Profilfoto fehlt');
  if (!user.phone_number) warnings.push('Telefonnummer fehlt');
  if (!user.gender) warnings.push('Geschlecht fehlt');
  
  // Couple-specific checks
  if (user.is_couple) {
    if (!user.partner_name?.trim()) warnings.push('Partnername fehlt');
    if (!user.partner_photo_url) warnings.push('Partnerfoto fehlt');
  }
  
  return warnings;
};
import { IdDocumentViewer } from '@/components/IdDocumentViewer';
import { AdminAnalyticsDashboard } from '@/components/AdminAnalyticsDashboard';
import { AdminUserProfileDialog } from '@/components/AdminUserProfileDialog';
import { AdminMessageDialog } from '@/components/AdminMessageDialog';
import { AdminNotificationSettings } from '@/components/AdminNotificationSettings';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Admin = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State for user profile dialog
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  
  // State for admin message dialog
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messagePreselectedUser, setMessagePreselectedUser] = useState<any>(null);

  // Check if current user is admin
  const { data: isAdmin, isLoading: adminCheckLoading } = useQuery({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      return !!roles;
    },
  });

  // Fetch pending verifications (sorted by newest first) - ALL profile fields
  const { data: pendingVerifications, isLoading: verificationsLoading } = useQuery({
    queryKey: ['pendingVerifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, first_name, last_name, nickname, gender, phone_number, phone_verified,
          avatar_url, verification_status, id_verified, id_document_url,
          partner_name, partner_photo_url, partner_gender, is_couple,
          private_address, private_city, private_postal_code,
          age, allergens, dislikes, languages, role, visibility_mode,
          karma, successful_pickups, no_shows, vacation_mode, notification_radius,
          latitude, longitude, iban, display_real_name,
          created_at, updated_at
        `)
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch all profiles for duplicate detection
  const { data: allProfilesForDuplicates } = useQuery({
    queryKey: ['allProfilesForDuplicates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, private_address, private_city, private_postal_code, verification_status');

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Helper function to find potential duplicates for a user
  const findPotentialDuplicates = (userId: string, firstName: string | null, lastName: string | null, address: string | null, city: string | null) => {
    if (!allProfilesForDuplicates || !firstName || !lastName) return [];
    
    const normalizedName = `${firstName.toLowerCase().trim()} ${lastName.toLowerCase().trim()}`;
    const normalizedAddress = address?.toLowerCase().trim() || '';
    const normalizedCity = city?.toLowerCase().trim() || '';
    
    return allProfilesForDuplicates.filter(profile => {
      if (profile.id === userId) return false; // Skip self
      
      const profileName = `${(profile.first_name || '').toLowerCase().trim()} ${(profile.last_name || '').toLowerCase().trim()}`;
      const profileAddress = (profile.private_address || '').toLowerCase().trim();
      const profileCity = (profile.private_city || '').toLowerCase().trim();
      
      // Check for same name
      const sameNameMatch = profileName === normalizedName;
      
      // Check for same address (if both have addresses)
      const sameAddressMatch = normalizedAddress && profileAddress && 
        (profileAddress.includes(normalizedAddress) || normalizedAddress.includes(profileAddress));
      
      // Check for same city
      const sameCityMatch = normalizedCity && profileCity && profileCity === normalizedCity;
      
      // Flag if: same name + same address, OR same name + same city
      return sameNameMatch && (sameAddressMatch || (sameCityMatch && normalizedAddress && profileAddress));
    });
  };

  // Fetch analytics data
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const [profilesCount, mealsCount, bookingsCount] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('meals').select('id', { count: 'exact', head: true }),
        supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .in('status', ['pending', 'confirmed']),
      ]);

      return {
        totalUsers: profilesCount.count || 0,
        totalMeals: mealsCount.count || 0,
        activeBookings: bookingsCount.count || 0,
      };
    },
    enabled: isAdmin,
  });

  // Fetch all users for user management - Use Edge Function for admin-only data including email
  const { data: allUsers, isLoading: usersLoading } = useQuery({
    queryKey: ['allUsersAdmin'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-list-users');
      
      if (error) throw error;
      return data?.users || [];
    },
    enabled: isAdmin,
  });

  // Fetch feedback
  const { data: feedbackList, isLoading: feedbackLoading } = useQuery({
    queryKey: ['feedbackList'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_feedback')
        .select(`
          id,
          subject,
          message,
          status,
          created_at,
          user:profiles!user_id (
            first_name,
            last_name,
            nickname
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch FAQ requests
  const { data: faqRequests, isLoading: faqLoading } = useQuery({
    queryKey: ['faqRequests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faq_requests')
        .select('*')
        .in('status', ['pending', 'answered'])
        .order('similar_count', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch profile reminders status
  const { data: profileReminders, isLoading: remindersLoading, refetch: refetchReminders } = useQuery({
    queryKey: ['profileReminders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profile_reminders')
        .select('user_id, reminder_count, last_sent_at, created_at')
        .order('last_sent_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch incomplete profiles count
  const { data: incompleteProfiles, isLoading: incompleteLoading } = useQuery({
    queryKey: ['incompleteProfiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, avatar_url, phone_number, private_address')
        .or('avatar_url.is.null,phone_number.is.null,private_address.is.null');

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const { data: pendingPayouts, isLoading: payoutsLoading } = useQuery({
    queryKey: ['pendingPayouts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          payment_amount,
          meal_id,
          meals!inner (
            chef_id,
            title,
            profiles!inner (
              id,
              first_name,
              last_name,
              nickname,
              iban
            )
          )
        `)
        .eq('payout_status', 'requested');

      if (error) throw error;

      // Group by chef
      const groupedByChef = data?.reduce((acc: any, booking: any) => {
        const chefId = booking.meals.profiles.id;
        if (!acc[chefId]) {
          acc[chefId] = {
            chef: booking.meals.profiles,
            bookings: [],
            totalAmount: 0,
          };
        }
        const netAmount = (booking.payment_amount || 0) * 0.9;
        acc[chefId].bookings.push(booking);
        acc[chefId].totalAmount += netAmount;
        return acc;
      }, {});

      return Object.values(groupedByChef || {});
    },
    enabled: isAdmin,
  });

  // Approve verification mutation
  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          verification_status: 'approved',
          id_verified: true 
        })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t('admin.approval_success'));
      queryClient.invalidateQueries({ queryKey: ['pendingVerifications'] });
    },
    onError: () => {
      toast.error(t('admin.approval_failed'));
    },
  });

  // Reject verification mutation
  const rejectMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ verification_status: 'rejected' })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t('admin.rejection_success'));
      queryClient.invalidateQueries({ queryKey: ['pendingVerifications'] });
    },
    onError: () => {
      toast.error(t('admin.rejection_failed'));
    },
  });

  // Update feedback status mutation
  const updateFeedbackMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('app_feedback')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t('admin.feedback_updated'));
      queryClient.invalidateQueries({ queryKey: ['feedbackList'] });
    },
    onError: () => {
      toast.error(t('admin.feedback_update_failed'));
    },
  });

  // Mark payout as paid mutation
  const markPaidMutation = useMutation({
    mutationFn: async (bookingIds: string[]) => {
      const { error } = await supabase
        .from('bookings')
        .update({ payout_status: 'paid' })
        .in('id', bookingIds);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Auszahlung als bezahlt markiert');
      queryClient.invalidateQueries({ queryKey: ['pendingPayouts'] });
    },
    onError: () => {
      toast.error('Fehler beim Aktualisieren der Auszahlung');
    },
  });

  // FAQ request mutations
  const [faqAnswers, setFaqAnswers] = useState<Record<string, string>>({});

  const publishFaqMutation = useMutation({
    mutationFn: async ({ id, answer }: { id: string; answer: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('faq_requests')
        .update({ 
          status: 'published',
          admin_answer: answer,
          answered_by: user?.id,
          answered_at: new Date().toISOString(),
          published_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t('admin.faq_published'));
      queryClient.invalidateQueries({ queryKey: ['faqRequests'] });
      queryClient.invalidateQueries({ queryKey: ['publishedFaqs'] });
    },
    onError: () => {
      toast.error(t('admin.faq_update_failed'));
    },
  });

  const rejectFaqMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('faq_requests')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t('admin.faq_rejected'));
      queryClient.invalidateQueries({ queryKey: ['faqRequests'] });
    },
    onError: () => {
      toast.error(t('admin.faq_update_failed'));
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.rpc('admin_delete_user', {
        target_user_id: userId
      });

      if (error) throw error;
      const result = data as { success: boolean; message: string };
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: () => {
      toast.success('Benutzer erfolgreich gelöscht');
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Löschen: ' + error.message);
    },
  });

  // Toggle user disabled status mutation
  const toggleUserDisabledMutation = useMutation({
    mutationFn: async ({ userId, isDisabled }: { userId: string; isDisabled: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_disabled: isDisabled })
        .eq('id', userId);

      if (error) throw error;
      return { userId, isDisabled };
    },
    onSuccess: ({ isDisabled }) => {
      toast.success(isDisabled ? 'Benutzer deaktiviert' : 'Benutzer reaktiviert');
      queryClient.invalidateQueries({ queryKey: ['allUsersAdmin'] });
    },
    onError: (error: Error) => {
      toast.error('Fehler: ' + error.message);
    },
  });

  // Send profile reminders mutation
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  
  const sendProfileRemindersMutation = useMutation({
    mutationFn: async () => {
      setIsSendingReminders(true);
      
      // Get current session for auth header
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated - please log in again');
      }
      
      const { data, error } = await supabase.functions.invoke('send-profile-reminders', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      if (error) {
        // Extract detailed error info
        const errorDetails = {
          functionName: 'send-profile-reminders',
          statusCode: error.status || 'unknown',
          message: error.message || 'Unknown error',
          context: error.context || null,
          requestId: data?.requestId || null
        };
        console.error('[Admin] Reminder function error:', errorDetails, error);
        throw new Error(JSON.stringify(errorDetails));
      }
      
      return data;
    },
    onSuccess: (data) => {
      setIsSendingReminders(false);
      console.log('[Admin] Reminder success:', data);
      
      if (data.sent > 0) {
        toast.success(`${data.sent} Erinnerungs-E-Mail(s) versendet!`, {
          description: data.sentTo?.join(', ') || undefined
        });
      } else {
        toast.info('Keine E-Mails zu versenden. Alle User sind aktuell oder haben bereits 3 Erinnerungen erhalten.');
      }
      
      if (data.errors && data.errors.length > 0) {
        toast.warning(`${data.errors.length} Fehler aufgetreten`, {
          description: data.errors.slice(0, 3).join('\n')
        });
      }
      
      refetchReminders();
      queryClient.invalidateQueries({ queryKey: ['profileReminders'] });
    },
    onError: (error: Error) => {
      setIsSendingReminders(false);
      console.error('[Admin] Reminder mutation error:', error);
      
      // Parse error details if JSON
      let errorInfo: any = { message: error.message };
      try {
        errorInfo = JSON.parse(error.message);
      } catch {
        // Not JSON, use raw message
      }
      
      // Show detailed toast with retry option
      toast.error('Erinnerungen senden fehlgeschlagen', {
        description: `
          Funktion: ${errorInfo.functionName || 'send-profile-reminders'}
          Status: ${errorInfo.statusCode || 'unbekannt'}
          Fehler: ${errorInfo.message || error.message}
          ${errorInfo.requestId ? `Request-ID: ${errorInfo.requestId}` : ''}
        `.trim(),
        duration: 10000,
        action: {
          label: 'Erneut versuchen',
          onClick: () => sendProfileRemindersMutation.mutate()
        }
      });
    },
  });

  // Generate image mutation
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  
  const generatePumpkinLasagnaImage = async () => {
    setIsGeneratingImage(true);
    toast.loading('Generating authentic pumpkin lasagna image...');
    
    try {
      const prompt = `A rustic, rectangular ceramic baking dish filled with a freshly baked, homemade pumpkin lasagna, sitting on a worn wooden kitchen table. The top layer is bubbling with golden-brown, melted mozzarella and parmesan cheese, with slightly caramelized crispy edges. The garnish is scattered crispy fried sage leaves and a light dusting of nutmeg. A serving spatula is lifting the first corner piece, revealing creamy layers of béchamel sauce, tender pasta sheets, and visible chunks of roasted orange Hokkaido pumpkin. In the soft-focus background, there is a crumpled linen towel, a small bowl of grated parmesan, and natural light coming from a kitchen window. The overall mood is cozy, warm, and inviting, food photography style. No fresh green herbs like basil or parsley. Photorealistic, authentic, rustic.`;
      
      const { data, error } = await supabase.functions.invoke('generate-meal-image', {
        body: { 
          prompt,
          mealId: '02794e5e-20c5-412a-89ba-596d6177b4a6'
        }
      });

      if (error) throw error;
      
      toast.dismiss();
      toast.success('Image generated and updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['meals'] });
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to generate image: ' + (error as Error).message);
      console.error('Image generation error:', error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  if (adminCheckLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <Shield className="w-12 h-12 text-destructive" />
            </div>
            <CardTitle className="text-center text-2xl">Access Denied</CardTitle>
            <CardDescription className="text-center">
              You don't have permission to access the admin dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/feed')} className="w-full">
              Back to Feed
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            </div>
            <p className="text-muted-foreground">Manage verifications, analytics, and feedback</p>
          </div>
          <Button 
            onClick={() => {
              setMessagePreselectedUser(null);
              setMessageDialogOpen(true);
            }}
            className="gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Nachricht senden
          </Button>
        </div>

        {/* Pending Approvals Widget - Always Visible at Top */}
        {pendingVerifications && pendingVerifications.length > 0 && (
          <Card className="mb-6 border-2 border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-primary" />
                    Wartet auf Überprüfung
                  </CardTitle>
                  <CardDescription>
                    {pendingVerifications.length} {pendingVerifications.length === 1 ? 'Nutzer wartet' : 'Nutzer warten'} auf Verifizierung
                  </CardDescription>
                </div>
                <Badge variant="destructive" className="text-lg px-3 py-1">
                  {pendingVerifications.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingVerifications.slice(0, 3).map((user) => (
                <Card key={user.id} className="border-border bg-background">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-16 h-16 cursor-pointer hover:ring-2 ring-primary" onClick={() => {
                        const imageUrl = user.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.id}`;
                        window.open(imageUrl, '_blank');
                      }}>
                        <AvatarImage src={user.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.id}`} />
                        <AvatarFallback>{user.first_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 
                          className="font-semibold text-base cursor-pointer hover:text-primary hover:underline"
                          onClick={() => {
                            setSelectedUser(user);
                            setProfileDialogOpen(true);
                          }}
                        >
                          {user.first_name} {user.last_name}
                        </h3>
                        {user.nickname && (
                          <p className="text-xs text-muted-foreground">@{user.nickname}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {user.gender === 'female' ? '👩' : user.gender === 'male' ? '👨' : '🌈'} {user.gender || 'Unbekannt'}
                          </Badge>
                          {user.phone_number && (
                            <Badge variant="secondary" className="text-xs">📱 {user.phone_number}</Badge>
                          )}
                          {/* Profile Warnings Badge */}
                          {(() => {
                            const warnings = getProfileWarnings(user);
                            if (warnings.length > 0) {
                              return (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge variant="destructive" className="text-xs gap-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        {warnings.length} unvollständig
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="max-w-xs">
                                      <p className="font-medium mb-1">Fehlende Angaben:</p>
                                      <ul className="text-xs list-disc ml-3">
                                        {warnings.map((w, i) => <li key={i}>{w}</li>)}
                                      </ul>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              );
                            }
                            return null;
                                        })()}
                                        </div>
                                        {/* Address info in widget */}
                                        {(user.private_address || user.private_city) && (
                                          <p className="text-xs text-muted-foreground mt-1">
                                            📍 {user.private_address && `${user.private_address}, `}{user.private_postal_code} {user.private_city}
                                          </p>
                                        )}
                                        {user.partner_name && (
                                          <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                                            <span className="font-medium">👫 Couple:</span> Partner {user.partner_name} ({user.partner_gender})
                                            {user.partner_photo_url && (
                                              <Avatar className="w-8 h-8 inline-block ml-2 cursor-pointer" onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(user.partner_photo_url!, '_blank');
                                              }}>
                                                <AvatarImage src={user.partner_photo_url} />
                                                <AvatarFallback>{user.partner_name?.charAt(0)}</AvatarFallback>
                                              </Avatar>
                                            )}
                                          </div>
                                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => approveMutation.mutate(user.id)}
                          disabled={approveMutation.isPending}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => rejectMutation.mutate(user.id)}
                          disabled={rejectMutation.isPending}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {pendingVerifications.length > 3 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  + {pendingVerifications.length - 3} weitere Anfragen im Verifications Tab
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="verifications" className="space-y-6">
          <div className="overflow-x-auto -mx-4 px-4 pb-2">
            <TabsList className="inline-flex w-auto min-w-full md:grid md:w-full md:grid-cols-8 gap-1">
              <TabsTrigger value="verifications" className="whitespace-nowrap">
                Verifications
                {pendingVerifications && pendingVerifications.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {pendingVerifications.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="users" className="whitespace-nowrap">Users</TabsTrigger>
              <TabsTrigger value="analytics" className="whitespace-nowrap">Analytics</TabsTrigger>
              <TabsTrigger value="reminders" className="whitespace-nowrap">
                <Mail className="w-4 h-4 mr-1" />
                Reminders
                {incompleteProfiles && incompleteProfiles.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {incompleteProfiles.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="feedback" className="whitespace-nowrap">
                Feedback
                {feedbackList?.filter(f => f.status === 'pending').length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {feedbackList?.filter(f => f.status === 'pending').length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="faq" className="whitespace-nowrap">
                FAQ
                {faqRequests && faqRequests.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {faqRequests.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="payouts" className="whitespace-nowrap">Payouts</TabsTrigger>
              <TabsTrigger value="settings" className="whitespace-nowrap">
                <Settings className="w-4 h-4 mr-1" />
                Settings
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Verification Queue Tab */}
          <TabsContent value="verifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Verifications</CardTitle>
                <CardDescription>
                  Review user verification requests (ID/Phone verification)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {verificationsLoading ? (
                  <p className="text-muted-foreground text-center py-8">Loading verifications...</p>
                ) : !pendingVerifications || pendingVerifications.length === 0 ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <AlertDescription>
                      No pending verifications. All users are up to date!
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {pendingVerifications.map((user) => {
                      // Get email from allUsers if available
                      const userWithEmail = allUsers?.find((u: any) => u.id === user.id);
                      const userEmail = userWithEmail?.email || '-';
                      
                      return (
                      <Card key={user.id} className="border-muted">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <Avatar className="w-16 h-16 cursor-pointer hover:ring-2 ring-primary" onClick={() => {
                              const imageUrl = user.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.id}`;
                              window.open(imageUrl, '_blank');
                            }}>
                              <AvatarImage src={user.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.id}`} />
                              <AvatarFallback>{user.first_name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2">
                              <div>
                                <h3 
                                  className="font-semibold text-lg cursor-pointer hover:text-primary hover:underline"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setProfileDialogOpen(true);
                                  }}
                                >
                                  {user.first_name} {user.last_name}
                                </h3>
                                {user.nickname && (
                                  <p className="text-sm text-muted-foreground">@{user.nickname}</p>
                                )}
                                {/* Email display for verification */}
                                <p className="text-sm text-primary flex items-center gap-1 mt-1">
                                  <Mail className="w-3 h-3" />
                                  {userEmail}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="outline">
                                  {user.gender === 'female' ? '👩' : user.gender === 'male' ? '👨' : '🌈'} {user.gender || 'Unbekannt'}
                                </Badge>
                                {user.phone_number && (
                                  <Badge variant="secondary">📱 {user.phone_number}</Badge>
                                )}
                                {/* Profile Warnings Badge */}
                                {(() => {
                                  const warnings = getProfileWarnings(user);
                                  if (warnings.length > 0) {
                                    return (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Badge variant="destructive" className="gap-1">
                                              <AlertTriangle className="w-3 h-3" />
                                              {warnings.length} unvollständig
                                            </Badge>
                                          </TooltipTrigger>
                                          <TooltipContent side="bottom" className="max-w-xs">
                                            <p className="font-medium mb-1">Fehlende Angaben:</p>
                                            <ul className="text-xs list-disc ml-3">
                                              {warnings.map((w, i) => <li key={i}>{w}</li>)}
                                            </ul>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                              
                              {/* Duplicate Detection Warning */}
                              {(() => {
                                const duplicates = findPotentialDuplicates(
                                  user.id, 
                                  user.first_name, 
                                  user.last_name, 
                                  user.private_address, 
                                  user.private_city
                                );
                                if (duplicates.length > 0) {
                                  return (
                                    <div className="mt-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                                      <p className="text-sm font-medium flex items-center gap-2 text-destructive mb-1">
                                        ⚠️ Mögliche Duplikate gefunden!
                                      </p>
                                      <p className="text-xs text-muted-foreground mb-2">
                                        {duplicates.length} Nutzer mit gleichem Namen und ähnlicher Adresse:
                                      </p>
                                      <ul className="text-xs space-y-1">
                                        {duplicates.map((dup) => (
                                          <li key={dup.id} className="flex items-center gap-2">
                                            <Badge variant={dup.verification_status === 'approved' ? 'default' : 'secondary'} className="text-xs">
                                              {dup.verification_status}
                                            </Badge>
                                            <span>{dup.first_name} {dup.last_name}</span>
                                            {dup.private_address && (
                                              <span className="text-muted-foreground">
                                                — {dup.private_address}, {dup.private_city}
                                              </span>
                                            )}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                              
                              {/* Address Info for Admin - to detect duplicates */}
                              {(user.private_address || user.private_city || user.private_postal_code) && (
                                <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                  <p className="text-sm font-medium flex items-center gap-2 mb-1">
                                    🏠 Registrierte Adresse
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {user.private_address && <span>{user.private_address}<br /></span>}
                                    {(user.private_postal_code || user.private_city) && (
                                      <span>{user.private_postal_code} {user.private_city}</span>
                                    )}
                                  </p>
                                </div>
                              )}
                              
                              {/* ID Document Preview for Admin */}
                              {user.id_document_url && (
                                <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                  <p className="text-sm font-medium flex items-center gap-2">
                                    🪪 ID-Dokument hochgeladen
                                  </p>
                                  <IdDocumentViewer 
                                    filePath={user.id_document_url} 
                                    userId={user.id}
                                  />
                                </div>
                              )}
                              
                              {user.partner_name && (
                                <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                                  <div className="flex items-center gap-3">
                                    {user.partner_photo_url && (
                                      <Avatar className="w-12 h-12 cursor-pointer hover:ring-2 ring-primary" onClick={() => {
                                        window.open(user.partner_photo_url!, '_blank');
                                      }}>
                                        <AvatarImage src={user.partner_photo_url} />
                                        <AvatarFallback>{user.partner_name?.charAt(0)}</AvatarFallback>
                                      </Avatar>
                                    )}
                                    <div>
                                      <p className="text-sm font-medium">👫 Couple Registration</p>
                                      <p className="text-sm text-muted-foreground">
                                        Partner: {user.partner_name} ({user.partner_gender})
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              <p className="text-xs text-muted-foreground">
                                Requested: {new Date(user.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button
                              onClick={() => approveMutation.mutate(user.id)}
                              disabled={approveMutation.isPending}
                              className="flex-1"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              {t('admin.approve')}
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => rejectMutation.mutate(user.id)}
                              disabled={rejectMutation.isPending}
                              className="flex-1"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              {t('admin.reject')}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Benutzerverwaltung</CardTitle>
                <CardDescription>
                  Alle registrierten Benutzer anzeigen und verwalten
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <p className="text-muted-foreground text-center py-8">Lade Benutzer...</p>
                ) : !allUsers || allUsers.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Keine Benutzer gefunden.</AlertDescription>
                  </Alert>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-3 text-sm font-semibold">Name</th>
                          <th className="text-left p-3 text-sm font-semibold">E-Mail</th>
                          <th className="text-left p-3 text-sm font-semibold">Telefon</th>
                          <th className="text-left p-3 text-sm font-semibold">Blocks</th>
                          <th className="text-left p-3 text-sm font-semibold">Registriert</th>
                          <th className="text-left p-3 text-sm font-semibold">Status</th>
                          <th className="text-right p-3 text-sm font-semibold">Aktionen</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allUsers.map((user) => (
                          <tr key={user.id} className="border-b border-border/50 hover:bg-muted/50">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-10 h-10 cursor-pointer" onClick={() => {
                                  const url = user.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.id}`;
                                  window.open(url, '_blank');
                                }}>
                                  <AvatarImage src={user.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.id}`} />
                                  <AvatarFallback>{user.first_name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {user.is_couple && user.partner_photo_url && (
                                  <Avatar className="w-10 h-10 -ml-4 border-2 border-background cursor-pointer" onClick={() => {
                                    window.open(user.partner_photo_url!, '_blank');
                                  }}>
                                    <AvatarImage src={user.partner_photo_url} />
                                    <AvatarFallback>{user.partner_name?.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                )}
                                <div>
                                  <p 
                                    className="text-sm font-medium cursor-pointer hover:text-primary hover:underline"
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setProfileDialogOpen(true);
                                    }}
                                  >
                                    {user.first_name} {user.last_name}
                                    {user.is_couple && user.partner_name && (
                                      <span className="text-muted-foreground"> & {user.partner_name}</span>
                                    )}
                                  </p>
                                  <div className="flex items-center gap-1">
                                    {user.nickname && (
                                      <span className="text-xs text-muted-foreground">@{user.nickname}</span>
                                    )}
                                    <Badge variant="outline" className="text-[10px] py-0 px-1">
                                      {user.gender === 'female' ? '👩' : user.gender === 'male' ? '👨' : '🌈'}
                                    </Badge>
                                    {user.is_couple && (
                                      <Badge variant="secondary" className="text-[10px] py-0 px-1">👫</Badge>
                                    )}
                                    {/* Inline warning icon for incomplete profiles */}
                                    {(() => {
                                      const warnings = getProfileWarnings(user);
                                      if (warnings.length > 0) {
                                        return (
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <span className="text-destructive cursor-help">
                                                  <AlertTriangle className="w-3 h-3" />
                                                </span>
                                              </TooltipTrigger>
                                              <TooltipContent side="right" className="max-w-xs">
                                                <p className="font-medium mb-1">⚠️ Unvollständiges Profil:</p>
                                                <ul className="text-xs list-disc ml-3">
                                                  {warnings.map((w, i) => <li key={i}>{w}</li>)}
                                                </ul>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-sm">{user.email || '-'}</td>
                            <td className="p-3 text-sm">{user.phone_number || '-'}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-1">
                                <span className="text-xs">↗{user.blocks_made_count || 0}</span>
                                <span className="text-muted-foreground">/</span>
                                <span className="text-xs">↙{user.blocks_received_count || 0}</span>
                                {user.needs_review && (
                                  <Badge variant="destructive" className="text-[10px] ml-1">⚠️</Badge>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-sm">
                              {new Date(user.created_at).toLocaleDateString('de-CH')}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1">
                                <Badge 
                                  variant={user.verification_status === 'approved' ? 'default' : 
                                          user.verification_status === 'pending' ? 'secondary' : 'outline'}
                                >
                                  {user.verification_status}
                                </Badge>
                                {user.is_disabled && (
                                  <Badge variant="destructive">Deaktiviert</Badge>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex gap-1 justify-end">
                                <Button
                                  variant={user.is_disabled ? 'outline' : 'secondary'}
                                  size="sm"
                                  onClick={() => {
                                    toggleUserDisabledMutation.mutate({ 
                                      userId: user.id, 
                                      isDisabled: !user.is_disabled 
                                    });
                                  }}
                                  disabled={toggleUserDisabledMutation.isPending}
                                >
                                  {user.is_disabled ? 'Aktivieren' : 'Deaktivieren'}
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    if (window.confirm(`Benutzer ${user.first_name} ${user.last_name} wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
                                      deleteUserMutation.mutate(user.id);
                                    }
                                  }}
                                  disabled={deleteUserMutation.isPending}
                                >
                                  Löschen
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            {/* Basic Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('admin.total_users')}</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsLoading ? '...' : analytics?.totalUsers || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Registered community members</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Meals</CardTitle>
                  <ChefHat className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsLoading ? '...' : analytics?.totalMeals || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Meals shared in community</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsLoading ? '...' : analytics?.activeBookings || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Pending or confirmed</p>
                </CardContent>
              </Card>
            </div>

            {/* Live Analytics Dashboard */}
            <AdminAnalyticsDashboard />
          </TabsContent>

          {/* Profile Reminders Tab */}
          <TabsContent value="reminders" className="space-y-4">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unvollständige Profile</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {incompleteLoading ? '...' : incompleteProfiles?.length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Fehlt: Avatar, Telefon oder Adresse</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Erinnerungen gesendet</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {remindersLoading ? '...' : profileReminders?.length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">User mit mind. 1 Erinnerung</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Max. erreicht (3/3)</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {remindersLoading ? '...' : profileReminders?.filter(r => r.reminder_count >= 3).length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Keine weiteren E-Mails</p>
                </CardContent>
              </Card>
            </div>

            {/* Manual Trigger Card */}
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-primary" />
                  Erinnerungs-E-Mails manuell auslösen
                </CardTitle>
                <CardDescription>
                  Sendet E-Mails an alle User mit unvollständigen Profilen, die noch keine 3 Erinnerungen erhalten haben und deren letzte Erinnerung mindestens 7 Tage zurückliegt.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Button 
                    onClick={() => sendProfileRemindersMutation.mutate()}
                    disabled={isSendingReminders || sendProfileRemindersMutation.isPending}
                    className="gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    {isSendingReminders ? 'Sende E-Mails...' : 'Jetzt Erinnerungen senden'}
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Automatischer Cron: Jeden Montag um 10:00 Uhr (UTC)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Reminder History Table */}
            <Card>
              <CardHeader>
                <CardTitle>Erinnerungs-Verlauf</CardTitle>
                <CardDescription>
                  Übersicht welche User wie viele Erinnerungen erhalten haben
                </CardDescription>
              </CardHeader>
              <CardContent>
                {remindersLoading ? (
                  <p className="text-muted-foreground text-center py-8">Lade Daten...</p>
                ) : !profileReminders || profileReminders.length === 0 ? (
                  <Alert>
                    <Mail className="h-4 w-4" />
                    <AlertDescription>
                      Noch keine Erinnerungen versendet.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-3 text-sm font-semibold">User</th>
                          <th className="text-left p-3 text-sm font-semibold">Erinnerungen</th>
                          <th className="text-left p-3 text-sm font-semibold">Letzte E-Mail</th>
                          <th className="text-left p-3 text-sm font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {profileReminders.map((reminder) => {
                          // Find user details from allUsers
                          const user = allUsers?.find(u => u.id === reminder.user_id);
                          const progressPercent = (reminder.reminder_count / 3) * 100;
                          
                          return (
                            <tr key={reminder.user_id} className="border-b border-border/50 hover:bg-muted/50">
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-8 h-8">
                                    <AvatarImage src={user?.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${reminder.user_id}`} />
                                    <AvatarFallback>{user?.first_name?.charAt(0) || '?'}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-sm font-medium">
                                      {user ? `${user.first_name} ${user.last_name}` : 'Unbekannt'}
                                    </p>
                                    {user?.nickname && (
                                      <p className="text-xs text-muted-foreground">@{user.nickname}</p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <Progress value={progressPercent} className="w-20 h-2" />
                                  <span className="text-sm font-medium">{reminder.reminder_count}/3</span>
                                </div>
                              </td>
                              <td className="p-3 text-sm">
                                {new Date(reminder.last_sent_at).toLocaleDateString('de-CH', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </td>
                              <td className="p-3">
                                {reminder.reminder_count >= 3 ? (
                                  <Badge variant="outline" className="bg-muted">
                                    ✅ Abgeschlossen
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">
                                    📧 {3 - reminder.reminder_count} verbleibend
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Feedback</CardTitle>
                <CardDescription>Bug reports and feature suggestions</CardDescription>
              </CardHeader>
              <CardContent>
                {feedbackLoading ? (
                  <p className="text-muted-foreground text-center py-8">Loading feedback...</p>
                ) : !feedbackList || feedbackList.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>No feedback submitted yet.</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {feedbackList.map((feedback: any) => (
                      <Card key={feedback.id} className="border-muted">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold">{feedback.subject}</h3>
                              <p className="text-sm text-muted-foreground">
                                From: {feedback.user?.first_name} {feedback.user?.last_name} (@{feedback.user?.nickname})
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(feedback.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant={feedback.status === 'pending' ? 'secondary' : 'outline'}>
                              {feedback.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-foreground mt-3 mb-4">{feedback.message}</p>
                          {feedback.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateFeedbackMutation.mutate({ id: feedback.id, status: 'reviewing' })}
                              >
                                Mark as Reviewing
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => updateFeedbackMutation.mutate({ id: feedback.id, status: 'resolved' })}
                              >
                                Mark as Resolved
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payouts Tab */}
          <TabsContent value="payouts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Auszahlungen / Payouts</CardTitle>
                <CardDescription>
                  Manage chef payout requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {payoutsLoading ? (
                  <p className="text-muted-foreground text-center py-8">Loading payouts...</p>
                ) : !pendingPayouts || pendingPayouts.length === 0 ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <AlertDescription>
                      No pending payout requests. All chefs are up to date!
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {pendingPayouts.map((payout: any) => (
                      <Card key={payout.chef.id} className="border-muted">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-semibold text-lg">
                                {payout.chef.first_name} {payout.chef.last_name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                @{payout.chef.nickname}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                IBAN: {payout.chef.iban || '⚠️ Missing'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary">
                                CHF {payout.totalAmount.toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {payout.bookings.length} booking(s)
                              </p>
                            </div>
                          </div>
                          
                          <Button
                            onClick={() => markPaidMutation.mutate(payout.bookings.map((b: any) => b.id))}
                            disabled={markPaidMutation.isPending || !payout.chef.iban}
                            className="w-full"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Als bezahlt markieren
                          </Button>
                          
                          {!payout.chef.iban && (
                            <Alert className="mt-3" variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription className="text-xs">
                                IBAN fehlt! Chef muss IBAN im Profil hinterlegen.
                              </AlertDescription>
                            </Alert>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQ Requests Tab */}
          <TabsContent value="faq" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircleQuestion className="w-5 h-5" />
                  {t('admin.faq_requests')}
                </CardTitle>
                <CardDescription>
                  {t('admin.faq_requests_desc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {faqLoading ? (
                  <p className="text-muted-foreground text-center py-8">Loading...</p>
                ) : !faqRequests || faqRequests.length === 0 ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <AlertDescription>
                      {t('admin.faq_no_requests')}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {faqRequests.map((faq) => (
                      <Card key={faq.id} className="border-muted">
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{faq.question}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(faq.created_at).toLocaleDateString('de-CH')} • {faq.similar_count}x {t('admin.faq_times_asked')}
                              </p>
                            </div>
                            <Badge variant={faq.status === 'answered' ? 'secondary' : 'outline'}>
                              {faq.status}
                            </Badge>
                          </div>
                          
                          <textarea
                            className="w-full min-h-[80px] p-2 text-sm border rounded-md bg-background resize-none"
                            placeholder={t('admin.faq_answer_placeholder')}
                            value={faqAnswers[faq.id] || faq.admin_answer || ''}
                            onChange={(e) => setFaqAnswers(prev => ({ ...prev, [faq.id]: e.target.value }))}
                          />
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => publishFaqMutation.mutate({ 
                                id: faq.id, 
                                answer: faqAnswers[faq.id] || faq.admin_answer || '' 
                              })}
                              disabled={publishFaqMutation.isPending || !(faqAnswers[faq.id] || faq.admin_answer)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              {t('admin.faq_publish')}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => rejectFaqMutation.mutate(faq.id)}
                              disabled={rejectFaqMutation.isPending}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              {t('admin.faq_reject')}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <AdminNotificationSettings />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImagePlus className="w-5 h-5" />
                  AI Image Generation
                </CardTitle>
                <CardDescription>
                  Generate authentic meal images using AI for demo content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This utility uses Lovable AI to generate photorealistic food images for the Kürbis-Lasagne demo meal.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Generate Pumpkin Lasagna Image</h4>
                  <p className="text-sm text-muted-foreground">
                    Creates an authentic, rustic homemade pumpkin lasagna photo to replace the stock image.
                  </p>
                  <Button
                    onClick={generatePumpkinLasagnaImage}
                    disabled={isGeneratingImage}
                    className="w-full"
                  >
                    <ImagePlus className="w-4 h-4 mr-2" />
                    {isGeneratingImage ? 'Generating...' : 'Generate Image'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* User Profile Dialog */}
      <AdminUserProfileDialog 
        user={selectedUser} 
        open={profileDialogOpen} 
        onOpenChange={setProfileDialogOpen}
        onSendMessage={(user) => {
          setMessagePreselectedUser({
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            nickname: user.nickname,
            avatar_url: user.avatar_url
          });
          setMessageDialogOpen(true);
        }}
      />

      {/* Admin Message Dialog */}
      <AdminMessageDialog
        open={messageDialogOpen}
        onOpenChange={setMessageDialogOpen}
        users={(allUsers || []).map(u => ({
          id: u.id,
          first_name: u.first_name,
          last_name: u.last_name,
          nickname: u.nickname,
          avatar_url: u.avatar_url
        }))}
        preselectedUser={messagePreselectedUser}
      />

      <BottomNav />
    </div>
  );
};

export default Admin;
