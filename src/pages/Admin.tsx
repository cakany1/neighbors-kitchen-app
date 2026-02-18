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
import { Shield, Users, ChefHat, Calendar, AlertCircle, CheckCircle, XCircle, ImagePlus, MessageCircleQuestion, AlertTriangle, Mail, Send, MessageSquare, Settings, Bell, BellOff, History, Clock, Zap, UserCog, Download, Activity, ClipboardCheck, Eye } from 'lucide-react';
import { AdminReadAuditLog } from '@/components/AdminReadAuditLog';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
}, t: any) => {
  const warnings: string[] = [];
  
  if (!user.first_name?.trim()) warnings.push(t('admin.warning_first_name_missing', 'Vorname fehlt'));
  if (!user.last_name?.trim()) warnings.push(t('admin.warning_last_name_missing', 'Nachname fehlt'));
  if (!user.avatar_url) warnings.push(t('admin.warning_avatar_missing', 'Profilfoto fehlt'));
  if (!user.phone_number) warnings.push(t('admin.warning_phone_missing', 'Telefonnummer fehlt'));
  if (!user.gender) warnings.push(t('admin.warning_gender_missing', 'Geschlecht fehlt'));
  
  // Couple-specific checks
  if (user.is_couple) {
    if (!user.partner_name?.trim()) warnings.push(t('admin.warning_partner_name_missing', 'Partnername fehlt'));
    if (!user.partner_photo_url) warnings.push(t('admin.warning_partner_photo_missing', 'Partnerfoto fehlt'));
  }
  
  return warnings;
};
import { IdDocumentViewer } from '@/components/IdDocumentViewer';
import { AdminAnalyticsDashboard } from '@/components/AdminAnalyticsDashboard';
import { AdminStripeStatus } from '@/components/AdminStripeStatus';
import { AdminUserProfileDialog } from '@/components/AdminUserProfileDialog';
import { AdminMessageDialog } from '@/components/AdminMessageDialog';
import { AdminNotificationSettings } from '@/components/AdminNotificationSettings';
import { VerificationRejectDialog, RejectionData } from '@/components/VerificationRejectDialog';
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
  
  // State for rejection dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [userToReject, setUserToReject] = useState<any>(null);
  
  // State for role change confirmation dialog
  const [roleChangeDialogOpen, setRoleChangeDialogOpen] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState<{ userId: string; userName: string; makeAdmin: boolean } | null>(null);

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
  // Includes BOTH primary verification_status='pending' AND partner_verification_status='pending' (with doc uploaded)
  const { data: pendingVerifications, isLoading: verificationsLoading } = useQuery({
    queryKey: ['pendingVerifications'],
    queryFn: async () => {
      const selectFields = `
        id, first_name, last_name, nickname, gender, phone_number, phone_verified,
        avatar_url, verification_status, id_verified, id_document_url,
        partner_name, partner_photo_url, partner_gender, is_couple,
        partner_verification_status, partner_id_document_url, partner_photo_verified,
        photo_verified,
        private_address, private_city, private_postal_code,
        age, allergens, dislikes, languages, role, visibility_mode,
        karma, successful_pickups, no_shows, vacation_mode, notification_radius,
        latitude, longitude, iban, display_real_name,
        created_at, updated_at
      `;

      // Query 1: Primary verification pending
      const { data: primaryPending, error: err1 } = await supabase
        .from('profiles')
        .select(selectFields)
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: false });

      if (err1) throw err1;

      // Query 2: Partner verification pending (couple accounts with partner doc uploaded)
      const { data: partnerDocPending, error: err2 } = await supabase
        .from('profiles')
        .select(selectFields)
        .eq('is_couple', true)
        .eq('partner_verification_status', 'pending')
        .not('partner_id_document_url', 'is', null)
        .neq('verification_status', 'pending') // avoid duplicates with query 1
        .order('created_at', { ascending: false });

      if (err2) throw err2;

      // Query 3: Partner photo not verified (couple accounts with partner photo uploaded)
      const { data: partnerPhotoPending, error: err3 } = await supabase
        .from('profiles')
        .select(selectFields)
        .eq('is_couple', true)
        .eq('partner_photo_verified', false)
        .not('partner_photo_url', 'is', null)
        .order('created_at', { ascending: false });

      if (err3) throw err3;

      // Merge and deduplicate all three queries
      const allPending = [...(primaryPending || [])];
      const existingIds = new Set(allPending.map(u => u.id));
      for (const user of [...(partnerDocPending || []), ...(partnerPhotoPending || [])]) {
        if (!existingIds.has(user.id)) {
          allPending.push(user);
          existingIds.add(user.id);
        }
      }

      return allPending;
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
              iban,
              last_payout_at
            )
          )
        `)
        .eq('payout_status', 'requested');

      if (error) throw error;

      // Get emails from admin-list-users edge function
      const { data: usersData } = await supabase.functions.invoke('admin-list-users');
      const emailMap = new Map(
        usersData?.users?.map((u: any) => [u.id, u.email]) || []
      );

      // Group by chef
      const groupedByChef = data?.reduce((acc: any, booking: any) => {
        const chefId = booking.meals.profiles.id;
        if (!acc[chefId]) {
          acc[chefId] = {
            chef: {
              ...booking.meals.profiles,
              email: emailMap.get(chefId) || null,
            },
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

  // Payout history query - for audit trail
  const { data: payoutHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['payoutHistory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_actions')
        .select('*')
        .eq('action', 'payout_marked_paid')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get user names for display
      const { data: usersData } = await supabase.functions.invoke('admin-list-users');
      const userMap = new Map(
        usersData?.users?.map((u: any) => [u.id, { 
          name: `${u.first_name} ${u.last_name}`,
          email: u.email 
        }]) || []
      );

      return data?.map((action: any) => ({
        ...action,
        chef: userMap.get(action.target_id) || { name: 'Unknown', email: '' },
        admin: userMap.get(action.actor_id) || { name: 'Unknown', email: '' },
      }));
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

  // Reject verification mutation - now with full flow
  const rejectMutation = useMutation({
    mutationFn: async ({ userId, reason, details, userEmail, userName }: { 
      userId: string; 
      reason: string; 
      details: string;
      userEmail: string;
      userName: string;
    }) => {
      // Get current user for rejected_by field
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // Get session for edge function auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('No session');
      
      // Update profile with rejection data
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          verification_status: 'rejected',
          rejection_reason: reason,
          rejection_details: details || null,
          rejected_at: new Date().toISOString(),
          rejected_by: user.id,
          // Clear any pending document
          id_document_url: null
        })
        .eq('id', userId);

      if (updateError) throw updateError;
      
      // Send rejection email via edge function
      const { data, error: emailError } = await supabase.functions.invoke('send-verification-rejection', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { userId, userEmail, userName, reason, details }
      });
      
      if (emailError) {
        console.error('Email notification failed:', emailError);
        // Don't throw - rejection was saved, email is secondary
      }
      
      return { emailSent: !emailError, emailData: data };
    },
    onSuccess: (result) => {
      setRejectDialogOpen(false);
      setUserToReject(null);
      toast.success(t('admin.rejection_success'), {
        description: result.emailSent 
          ? t('admin.rejection_email_sent')
          : t('admin.rejection_email_failed')
      });
      queryClient.invalidateQueries({ queryKey: ['pendingVerifications'] });
      queryClient.invalidateQueries({ queryKey: ['rejectedVerifications'] });
    },
    onError: (error: Error) => {
      toast.error(t('admin.rejection_failed'), {
        description: error.message
      });
    },
  });
  
  // Fetch rejected verifications for history
  const { data: rejectedVerifications, isLoading: rejectedLoading } = useQuery({
    queryKey: ['rejectedVerifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, first_name, last_name, nickname, avatar_url,
          verification_status, rejection_reason, rejection_details, 
          rejected_at, rejected_by, created_at
        `)
        .eq('verification_status', 'rejected')
        .not('rejected_at', 'is', null)
        .order('rejected_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
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

  // Payout note state
  const [payoutNote, setPayoutNote] = useState('');
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<any>(null);

  // Mark payout as paid mutation (with note and audit logging)
  const markPaidMutation = useMutation({
    mutationFn: async ({ bookingIds, chefId, amount, note }: { 
      bookingIds: string[]; 
      chefId: string; 
      amount: number;
      note: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update bookings to paid
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ payout_status: 'paid' })
        .in('id', bookingIds);

      if (bookingError) throw bookingError;

      // Update chef's last_payout_at
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ last_payout_at: new Date().toISOString() })
        .eq('id', chefId);

      if (profileError) throw profileError;

      // Log to admin_actions for audit
      const { error: auditError } = await supabase
        .from('admin_actions')
        .insert({
          actor_id: user.id,
          target_id: chefId,
          action: 'payout_marked_paid',
          metadata: {
            booking_ids: bookingIds,
            amount: amount,
            note: note || null,
            timestamp: new Date().toISOString(),
          },
        });

      if (auditError) console.error('Audit log failed:', auditError);
    },
    onSuccess: () => {
      toast.success(t('admin.payout_marked_paid'));
      queryClient.invalidateQueries({ queryKey: ['pendingPayouts'] });
      setPayoutDialogOpen(false);
      setPayoutNote('');
      setSelectedPayout(null);
    },
    onError: () => {
      toast.error(t('admin.payout_update_failed'));
    },
  });

  // CSV Export function for payouts
  const exportPayoutsCSV = () => {
    if (!pendingPayouts || pendingPayouts.length === 0) {
      toast.error(t('admin.no_payouts_to_export'));
      return;
    }

    const headers = t('admin.payout_csv_headers', { returnObjects: true }) as string[];
    const rows = pendingPayouts.map((payout: any) => [
      payout.chef.first_name || '',
      payout.chef.last_name || '',
      payout.chef.email || '',
      payout.chef.iban || '',
      payout.totalAmount.toFixed(2),
      payout.chef.last_payout_at ? new Date(payout.chef.last_payout_at).toLocaleDateString('de-CH') : 'Nie',
      payout.bookings.length.toString(),
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map((row: string[]) => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(';'))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payouts_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('admin.csv_exported'));
  };

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
    onSuccess: (_, userId) => {
      toast.success(t('admin.user_deleted'));
      
      // Optimistic UI: immediately remove deleted user from cached list
      const previousUsers = queryClient.getQueryData<any[]>(['allUsersAdmin']);
      if (previousUsers) {
        queryClient.setQueryData(
          ['allUsersAdmin'],
          previousUsers.filter(user => user.id !== userId)
        );
      }
      
      // Then invalidate to ensure server truth
      queryClient.invalidateQueries({ queryKey: ['allUsersAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: (error: Error) => {
      toast.error(t('admin.delete_error') + error.message);
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
      toast.success(isDisabled ? t('admin.user_deactivated') : t('admin.user_reactivated'));
      queryClient.invalidateQueries({ queryKey: ['allUsersAdmin'] });
    },
    onError: (error: Error) => {
      toast.error(t('admin.error_prefix') + error.message);
    },
  });

  // Toggle user role mutation with audit logging
  const toggleRoleMutation = useMutation({
    mutationFn: async ({ userId, makeAdmin }: { userId: string; makeAdmin: boolean }) => {
      // Get current user for audit
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Not authenticated');
      
      if (makeAdmin) {
        // Add admin role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });
        if (error) throw error;
      } else {
        // Remove admin role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');
        if (error) throw error;
      }
      
      // Log the action to admin_actions audit table
      const { error: auditError } = await supabase
        .from('admin_actions')
        .insert({
          actor_id: currentUser.id,
          target_id: userId,
          action: makeAdmin ? 'grant_admin' : 'revoke_admin',
          metadata: { previous_role: makeAdmin ? 'user' : 'admin', new_role: makeAdmin ? 'admin' : 'user' }
        });
      
      if (auditError) {
        console.error('Failed to log admin action:', auditError);
        // Don't throw - the role change succeeded, audit is secondary
      }
      
      return { userId, makeAdmin };
    },
    onSuccess: ({ makeAdmin }) => {
      toast.success(makeAdmin ? t('admin.admin_role_added') : t('admin.admin_role_removed'));
      queryClient.invalidateQueries({ queryKey: ['allUsersAdmin'] });
      setRoleChangeDialogOpen(false);
      setPendingRoleChange(null);
    },
    onError: (error: Error) => {
      toast.error(t('admin.error_prefix') + error.message);
      setRoleChangeDialogOpen(false);
      setPendingRoleChange(null);
    },
  });

  // Toggle user verified status mutation (admin-only)
  const toggleVerifiedMutation = useMutation({
    mutationFn: async ({ userId, verified }: { userId: string; verified: boolean }) => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          id_verified: verified,
          verification_status: verified ? 'approved' : 'pending'
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Log the action
      await supabase
        .from('admin_actions')
        .insert({
          actor_id: currentUser.id,
          target_id: userId,
          action: verified ? 'verify_user' : 'unverify_user',
          metadata: { id_verified: verified }
        });
      
      return { userId, verified };
    },
    onSuccess: ({ verified }) => {
      toast.success(verified ? t('admin.user_verified') : t('admin.user_unverified'));
      queryClient.invalidateQueries({ queryKey: ['allUsersAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['pendingVerifications'] });
    },
    onError: (error: Error) => {
      toast.error(t('admin.error_prefix') + error.message);
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
        const emailList = data.sentTo?.join('\n• ') || '';
        toast.success(t('admin.reminders_sent', { count: data.sent }), {
          description: emailList ? `An:\n• ${emailList}` : undefined,
          duration: 8000
        });
      } else {
        toast.info(t('admin.no_reminders_needed'));
      }
      
      if (data.errors && data.errors.length > 0) {
        toast.warning(t('admin.reminders_errors', { count: data.errors.length }), {
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
      toast.error(t('admin.reminders_failed'), {
        description: `
          Funktion: ${errorInfo.functionName || 'send-profile-reminders'}
          Status: ${errorInfo.statusCode || 'unbekannt'}
          Fehler: ${errorInfo.message || error.message}
          ${errorInfo.requestId ? `Request-ID: ${errorInfo.requestId}` : ''}
        `.trim(),
        duration: 10000,
        action: {
          label: t('admin.retry_action', 'Erneut versuchen'),
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
      toast.success(t('toast.image_generated'));
      queryClient.invalidateQueries({ queryKey: ['meals'] });
    } catch (error) {
      toast.dismiss();
      toast.error(t('toast.image_generation_failed') + ': ' + (error as Error).message);
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
        <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            </div>
            <p className="text-muted-foreground">Manage verifications, analytics, and feedback</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant="outline"
              onClick={() => navigate('/admin/health')}
              className="gap-2"
            >
              <Zap className="w-4 h-4" />
              System Health
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/admin/release-checklist')}
              className="gap-2"
            >
              <ClipboardCheck className="w-4 h-4" />
              Release QA
            </Button>
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
                            const warnings = getProfileWarnings(user, t);
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
                          onClick={() => {
                            setUserToReject(user);
                            setRejectDialogOpen(true);
                          }}
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
            <TabsList className="inline-flex w-auto min-w-full md:grid md:w-full md:grid-cols-9 gap-1">
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
              <TabsTrigger value="audit" className="whitespace-nowrap">
                <Eye className="w-4 h-4 mr-1" />
                Audit Log
              </TabsTrigger>
              <TabsTrigger value="health" className="whitespace-nowrap" onClick={() => navigate('/admin/health')}>
                <Activity className="w-4 h-4 mr-1" />
                Health
              </TabsTrigger>
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
                                {/* Verification type labels */}
                                {(user as any).verification_status === 'pending' && (
                                  <Badge variant="destructive" className="gap-1">
                                    🪪 ID-Verifizierung
                                  </Badge>
                                )}
                                {(user as any).is_couple && (user as any).partner_verification_status === 'pending' && (user as any).partner_id_document_url && (
                                  <Badge variant="destructive" className="gap-1 bg-pink-600">
                                    👫 Partner-Verifizierung
                                  </Badge>
                                )}
                                {(user as any).is_couple && !(user as any).partner_photo_verified && (user as any).partner_photo_url && (
                                  <Badge variant="secondary" className="gap-1">
                                    📸 Partner-Foto prüfen
                                  </Badge>
                                )}
                                <Badge variant="outline">
                                  {user.gender === 'female' ? '👩' : user.gender === 'male' ? '👨' : '🌈'} {user.gender || 'Unbekannt'}
                                </Badge>
                                {user.phone_number && (
                                  <Badge variant="secondary">📱 {user.phone_number}</Badge>
                                )}
                                {/* Profile Warnings Badge */}
                                {(() => {
                                  const warnings = getProfileWarnings(user, t);
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
                                <div className="mt-2 p-3 bg-muted/50 rounded-lg space-y-2">
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
                                      <div className="flex gap-2 mt-1">
                                        <Badge variant={(user as any).partner_verification_status === 'approved' ? 'default' : 'secondary'} className="text-xs">
                                          Partner-ID: {(user as any).partner_verification_status || 'pending'}
                                        </Badge>
                                        <Badge variant={(user as any).partner_photo_verified ? 'default' : 'secondary'} className="text-xs">
                                          Partner-Foto: {(user as any).partner_photo_verified ? '✓ verifiziert' : 'ausstehend'}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                  {/* Partner ID Document */}
                                  {(user as any).partner_id_document_url && (
                                    <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded">
                                      <p className="text-xs font-medium mb-1">🪪 Partner-ID-Dokument</p>
                                      <IdDocumentViewer 
                                        filePath={(user as any).partner_id_document_url} 
                                        userId={user.id}
                                      />
                                    </div>
                                  )}
                                  {/* Partner Approve/Photo Verify Buttons */}
                                  {((user as any).partner_verification_status === 'pending' || !(user as any).partner_photo_verified) && (
                                    <div className="flex gap-2 mt-2">
                                      {(user as any).partner_verification_status === 'pending' && (user as any).partner_id_document_url && (
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          className="text-xs"
                                          onClick={async () => {
                                            const { error } = await supabase
                                              .from('profiles')
                                              .update({ partner_verification_status: 'approved' as any })
                                              .eq('id', user.id);
                                            if (error) { toast.error(t('common.error') + ': ' + error.message); return; }
                                            toast.success(t('toast.partner_id_verified'));
                                            queryClient.invalidateQueries({ queryKey: ['pendingVerifications'] });
                                            queryClient.invalidateQueries({ queryKey: ['allUsersAdmin'] });
                                          }}
                                        >
                                          <CheckCircle className="w-3 h-3 mr-1" />
                                          Partner-ID genehmigen
                                        </Button>
                                      )}
                                      {!(user as any).partner_photo_verified && (user as any).partner_photo_url && (
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          className="text-xs"
                                          onClick={async () => {
                                            const { error } = await supabase
                                              .from('profiles')
                                              .update({ partner_photo_verified: true })
                                              .eq('id', user.id);
                                            if (error) { toast.error(t('common.error') + ': ' + error.message); return; }
                                            toast.success(t('toast.partner_photo_verified'));
                                            queryClient.invalidateQueries({ queryKey: ['pendingVerifications'] });
                                            queryClient.invalidateQueries({ queryKey: ['allUsersAdmin'] });
                                          }}
                                        >
                                          <ImagePlus className="w-3 h-3 mr-1" />
                                          Partner-Foto verifizieren
                                        </Button>
                                      )}
                                    </div>
                                  )}
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
                              onClick={() => {
                                setUserToReject(user);
                                setRejectDialogOpen(true);
                              }}
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
            
            {/* Rejection History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Ablehnungs-Historie
                </CardTitle>
                <CardDescription>
                  Zuletzt abgelehnte Verifizierungen mit Gründen
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rejectedLoading ? (
                  <p className="text-muted-foreground text-center py-8">Lade Historie...</p>
                ) : !rejectedVerifications || rejectedVerifications.length === 0 ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <AlertDescription>
                      Keine abgelehnten Verifizierungen vorhanden.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-2 font-semibold">Nutzer</th>
                          <th className="text-left p-2 font-semibold">Grund</th>
                          <th className="text-left p-2 font-semibold">Details</th>
                          <th className="text-left p-2 font-semibold">Datum</th>
                          <th className="text-left p-2 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rejectedVerifications.map((user) => {
                          const getReasonLabel = (reason: string | null) => {
                            if (!reason) return '-';
                            const key = `admin.rejection_reason_${reason}`;
                            const translated = t(key);
                            // If translation key not found, return the raw reason
                            return translated === key ? reason : translated;
                          };
                          
                          return (
                            <tr key={user.id} className="border-b border-border/50 hover:bg-muted/50">
                              <td className="p-2">
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-8 h-8">
                                    <AvatarImage src={user.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.id}`} />
                                    <AvatarFallback>{user.first_name?.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{user.first_name} {user.last_name}</p>
                                    {user.nickname && (
                                      <p className="text-xs text-muted-foreground">@{user.nickname}</p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="p-2">
                                <Badge variant="destructive" className="text-xs">
                                  {getReasonLabel(user.rejection_reason)}
                                </Badge>
                              </td>
                              <td className="p-2 max-w-[200px]">
                                <p className="text-xs text-muted-foreground truncate" title={user.rejection_details || ''}>
                                  {user.rejection_details || '-'}
                                </p>
                              </td>
                              <td className="p-2">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  {user.rejected_at ? new Date(user.rejected_at).toLocaleDateString('de-CH', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }) : '-'}
                                </div>
                              </td>
                              <td className="p-2">
                                <Badge variant="outline" className="text-xs">
                                  {user.verification_status}
                                </Badge>
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
                          <th className="text-left p-3 text-sm font-semibold">Role</th>
                          <th className="text-left p-3 text-sm font-semibold">Verifiziert</th>
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
                                      const warnings = getProfileWarnings(user, t);
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
                            <td className="p-3 text-sm font-mono text-xs">{user.email || '-'}</td>
                            <td className="p-3">
                              <Select
                                value={user.roles?.includes('admin') ? 'admin' : 'user'}
                                onValueChange={(value) => {
                                  const makeAdmin = value === 'admin';
                                  const currentIsAdmin = user.roles?.includes('admin');
                                  // Only trigger if there's an actual change
                                  if ((makeAdmin && !currentIsAdmin) || (!makeAdmin && currentIsAdmin)) {
                                    setPendingRoleChange({ 
                                      userId: user.id, 
                                      userName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'User',
                                      makeAdmin 
                                    });
                                    setRoleChangeDialogOpen(true);
                                  }
                                }}
                                disabled={toggleRoleMutation.isPending}
                              >
                                <SelectTrigger className="w-24 h-7 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">user</SelectItem>
                                  <SelectItem value="admin">admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-3">
                              <Button
                                variant={user.id_verified ? 'default' : 'outline'}
                                size="sm"
                                className="h-7 text-xs gap-1"
                                onClick={() => toggleVerifiedMutation.mutate({ userId: user.id, verified: !user.id_verified })}
                                disabled={toggleVerifiedMutation.isPending}
                              >
                                {user.id_verified ? (
                                  <>
                                    <CheckCircle className="w-3 h-3" />
                                    Verifiziert
                                  </>
                                ) : (
                                  'Verifizieren'
                                )}
                              </Button>
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
                                  onClick={async () => {
                                    // Guard: prevent deleting own user
                                    const { data: { user: currentUser } } = await supabase.auth.getUser();
                                    if (currentUser?.id === user.id) {
                                      toast.error(t('toast.cannot_delete_own_account'));
                                      return;
                                    }
                                    
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

            {/* Stripe Status */}
            <AdminStripeStatus />

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
                    {t('admin.cron_schedule_info', 'Automatischer Cron: Jeden Montag um 10:00 Uhr (UTC)')}
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

          {/* Audit Log Tab */}
          <TabsContent value="audit" className="space-y-4">
            <AdminReadAuditLog />
          </TabsContent>

          {/* Payouts Tab */}
          <TabsContent value="payouts" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{t('admin.payouts_title', 'Auszahlungen / Payouts')}</CardTitle>
                  <CardDescription>
                    Manage chef payout requests
                  </CardDescription>
                </div>
                {pendingPayouts && pendingPayouts.length > 0 && (
                  <Button variant="outline" size="sm" onClick={exportPayoutsCSV}>
                    <Download className="w-4 h-4 mr-2" />
                    CSV Export
                  </Button>
                )}
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
                            <div className="space-y-1">
                              <h3 className="font-semibold text-lg">
                                {payout.chef.first_name} {payout.chef.last_name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                @{payout.chef.nickname}
                              </p>
                              {payout.chef.email && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {payout.chef.email}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                IBAN: {payout.chef.iban || '⚠️ Missing'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Letzte Auszahlung: {payout.chef.last_payout_at 
                                  ? new Date(payout.chef.last_payout_at).toLocaleDateString('de-CH') 
                                  : 'Nie'}
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
                            onClick={() => {
                              setSelectedPayout(payout);
                              setPayoutDialogOpen(true);
                            }}
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

            {/* Payout Confirmation Dialog */}
            <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('admin.confirm_payout_title', 'Auszahlung bestätigen')}</DialogTitle>
                  <DialogDescription>
                    {selectedPayout && (
                      <>
                        {t('admin.confirm_payout_desc', 'Auszahlung an')} <strong>{selectedPayout.chef.first_name} {selectedPayout.chef.last_name}</strong> über <strong>CHF {selectedPayout.totalAmount.toFixed(2)}</strong> bestätigen?
                      </>
                    )}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="payout-note">Notiz (optional)</Label>
                    <Textarea
                      id="payout-note"
                      placeholder="z.B. Überweisung am 06.02.2026, Ref: XYZ..."
                      value={payoutNote}
                      onChange={(e) => setPayoutNote(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setPayoutDialogOpen(false);
                    setPayoutNote('');
                    setSelectedPayout(null);
                  }}>
                    Abbrechen
                  </Button>
                  <Button 
                    onClick={() => {
                      if (selectedPayout) {
                        markPaidMutation.mutate({
                          bookingIds: selectedPayout.bookings.map((b: any) => b.id),
                          chefId: selectedPayout.chef.id,
                          amount: selectedPayout.totalAmount,
                          note: payoutNote,
                        });
                      }
                    }}
                    disabled={markPaidMutation.isPending}
                  >
                    {markPaidMutation.isPending ? 'Wird gespeichert...' : 'Bestätigen'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Payout History Card */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  {t('admin.payout_history_title', 'Auszahlungs-Historie')}
                </CardTitle>
                <CardDescription>
                  {t('admin.payout_history_desc', 'Audit-Trail aller bestätigten Auszahlungen')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <p className="text-muted-foreground text-center py-8">Loading history...</p>
                ) : !payoutHistory || payoutHistory.length === 0 ? (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      {t('admin.no_payouts_confirmed', 'Noch keine Auszahlungen bestätigt.')}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    {payoutHistory.map((entry: any) => (
                      <div key={entry.id} className="border rounded-lg p-4 bg-muted/30">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">
                              {entry.chef?.name || 'Unknown Chef'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {entry.chef?.email}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">
                              CHF {(entry.metadata?.amount || 0).toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {entry.metadata?.booking_ids?.length || 0} Buchung(en)
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                          <div className="flex items-center justify-between">
                            <span>
                              Bestätigt von: {entry.admin?.name || 'Unknown'}
                            </span>
                            <span>
                              {new Date(entry.created_at).toLocaleString('de-CH', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          {entry.metadata?.note && (
                            <p className="mt-1 italic bg-muted p-2 rounded">
                              "{entry.metadata.note}"
                            </p>
                          )}
                        </div>
                      </div>
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
            
            {/* Admin Role Management */}
            <Card className="border-2 border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="w-5 h-5 text-primary" />
                  Admin-Rollen verwalten
                </CardTitle>
                <CardDescription>
                  Admins können andere Benutzer zu Admins befördern oder Admin-Rechte entziehen.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    ⚠️ Aktuelle Admins: Nur Benutzer mit Eintrag in der user_roles Tabelle mit role='admin' haben Admin-Zugriff.
                  </AlertDescription>
                </Alert>
                
                {/* List current admins */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Aktuelle Administratoren</h4>
                  <div className="space-y-2">
                    {allUsers?.filter((u: any) => {
                      // Check in user_roles if this user has admin role
                      return u.role === 'admin';
                    }).map((admin: any) => (
                      <div key={admin.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={admin.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${admin.id}`} />
                            <AvatarFallback>{admin.first_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{admin.first_name} {admin.last_name}</p>
                            <p className="text-xs text-muted-foreground">{admin.email || '-'}</p>
                          </div>
                        </div>
                        <Badge>Admin</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            
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

      {/* Verification Rejection Dialog */}
      <VerificationRejectDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        userName={userToReject ? `${userToReject.first_name} ${userToReject.last_name}` : ''}
        userEmail={allUsers?.find((u: any) => u.id === userToReject?.id)?.email}
        isPending={rejectMutation.isPending}
        onConfirm={async (data: RejectionData) => {
          if (!userToReject) return;
          const userEmail = allUsers?.find((u: any) => u.id === userToReject.id)?.email || '';
          await rejectMutation.mutateAsync({
            userId: userToReject.id,
            reason: data.reason,
            details: data.details,
            userEmail,
            userName: `${userToReject.first_name} ${userToReject.last_name}`
          });
        }}
      />

      {/* Role Change Confirmation Dialog */}
      <AlertDialog open={roleChangeDialogOpen} onOpenChange={setRoleChangeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingRoleChange?.makeAdmin ? 'Admin-Rechte vergeben' : 'Admin-Rechte entziehen'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRoleChange?.makeAdmin 
                ? `Möchtest du "${pendingRoleChange?.userName}" wirklich Admin-Rechte geben? Diese Person erhält vollen Zugriff auf das Admin-Dashboard.`
                : `Möchtest du "${pendingRoleChange?.userName}" wirklich die Admin-Rechte entziehen? Diese Person verliert den Zugriff auf das Admin-Dashboard.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingRoleChange(null)}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingRoleChange) {
                  toggleRoleMutation.mutate({ 
                    userId: pendingRoleChange.userId, 
                    makeAdmin: pendingRoleChange.makeAdmin 
                  });
                }
              }}
              className={pendingRoleChange?.makeAdmin ? '' : 'bg-destructive hover:bg-destructive/90'}
            >
              {toggleRoleMutation.isPending ? 'Wird gespeichert...' : 'Bestätigen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
};

export default Admin;
