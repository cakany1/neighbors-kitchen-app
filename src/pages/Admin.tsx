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
import { Shield, Users, ChefHat, Calendar, AlertCircle, CheckCircle, XCircle, ImagePlus } from 'lucide-react';
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

  // Fetch pending verifications
  const { data: pendingVerifications, isLoading: verificationsLoading } = useQuery({
    queryKey: ['pendingVerifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, nickname, gender, phone_number, verification_status, partner_name, partner_photo_url, partner_gender, created_at')
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

        <Tabs defaultValue="verifications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="verifications">
              Verifications
              {pendingVerifications && pendingVerifications.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingVerifications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="feedback">
              Feedback
              {feedbackList?.filter(f => f.status === 'pending').length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {feedbackList?.filter(f => f.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
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
                            <Avatar className="w-16 h-16">
                              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} />
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
