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
import { Shield, Users, ChefHat, Calendar, AlertCircle, CheckCircle, XCircle, ImagePlus, MessageCircleQuestion } from 'lucide-react';
import { IdDocumentViewer } from '@/components/IdDocumentViewer';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Admin = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  // Fetch pending verifications (sorted by newest first)
  const { data: pendingVerifications, isLoading: verificationsLoading } = useQuery({
    queryKey: ['pendingVerifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, nickname, gender, phone_number, avatar_url, verification_status, partner_name, partner_photo_url, partner_gender, created_at, id_document_url')
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

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

  // Fetch all users for user management
  const { data: allUsers, isLoading: usersLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, nickname, phone_number, created_at, verification_status')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
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
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground">Manage verifications, analytics, and feedback</p>
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
                        window.open(`https://api.dicebear.com/7.x/notionists/svg?seed=${user.id}`, '_blank');
                      }}>
                        <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user.id}`} />
                        <AvatarFallback>{user.first_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base">
                          {user.first_name} {user.last_name}
                        </h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {user.gender === 'female' ? '👩' : user.gender === 'male' ? '👨' : '🌈'} {user.gender}
                          </Badge>
                          {user.phone_number && (
                            <Badge variant="secondary" className="text-xs">📱 Verified</Badge>
                          )}
                        </div>
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
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="verifications">
              Verifications
              {pendingVerifications && pendingVerifications.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingVerifications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="feedback">
              Feedback
              {feedbackList?.filter(f => f.status === 'pending').length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {feedbackList?.filter(f => f.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="faq">
              FAQ
              {faqRequests && faqRequests.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {faqRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
            <TabsTrigger value="utilities">Utilities</TabsTrigger>
          </TabsList>

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
                    {pendingVerifications.map((user) => (
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
                                <h3 className="font-semibold text-lg">
                                  {user.first_name} {user.last_name}
                                </h3>
                                {user.nickname && (
                                  <p className="text-sm text-muted-foreground">@{user.nickname}</p>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="outline">
                                  {user.gender === 'female' ? '👩' : user.gender === 'male' ? '👨' : '🌈'} {user.gender}
                                </Badge>
                                {user.phone_number && (
                                  <Badge variant="secondary">📱 {user.phone_number}</Badge>
                                )}
                              </div>
                              
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
                                  <p className="text-sm font-medium">👫 Couple Registration</p>
                                  <p className="text-sm text-muted-foreground">
                                    Partner: {user.partner_name} ({user.partner_gender})
                                  </p>
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
                    ))}
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
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user.id}`} />
                                  <AvatarFallback>{user.first_name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">
                                    {user.first_name} {user.last_name}
                                  </p>
                                  {user.nickname && (
                                    <p className="text-xs text-muted-foreground">@{user.nickname}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-sm">-</td>
                            <td className="p-3 text-sm">{user.phone_number || '-'}</td>
                            <td className="p-3 text-sm">
                              {new Date(user.created_at).toLocaleDateString('de-CH')}
                            </td>
                            <td className="p-3">
                              <Badge 
                                variant={user.verification_status === 'approved' ? 'default' : 
                                        user.verification_status === 'pending' ? 'secondary' : 'outline'}
                              >
                                {user.verification_status}
                              </Badge>
                            </td>
                            <td className="p-3 text-right">
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

          {/* Utilities Tab */}
          <TabsContent value="utilities" className="space-y-4">
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

      <BottomNav />
    </div>
  );
};

export default Admin;
