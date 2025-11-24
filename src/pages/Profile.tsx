import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Star, Award, ChefHat, Heart, Globe, Shield, Loader2, Upload, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { allergenOptions, dislikeCategories } from '@/utils/ingredientDatabase';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import RadiusSliderMap from '@/components/maps/RadiusSliderMap';
import GalleryUpload from '@/components/GalleryUpload';
import GalleryGrid from '@/components/GalleryGrid';
import { BlockedUsersList } from '@/components/BlockedUsersList';
import { FeedbackDialog } from '@/components/FeedbackDialog';

import { VerificationBadge } from '@/components/VerificationBadge';
import { VerificationDialog } from '@/components/VerificationDialog';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch (German)' },
  { code: 'fr', name: 'Français (French)' },
  { code: 'it', name: 'Italiano (Italian)' },
  { code: 'es', name: 'Español (Spanish)' },
  { code: 'pt', name: 'Português (Portuguese)' },
  { code: 'ar', name: 'العربية (Arabic)' },
  { code: 'tr', name: 'Türkçe (Turkish)' },
  { code: 'vi', name: 'Tiếng Việt (Vietnamese)' },
  { code: 'th', name: 'ไทย (Thai)' },
  { code: 'zh', name: '中文 (Chinese)' },
];

const genderOptions = [
  { value: 'female', label: '👩 Female (Weiblich)' },
  { value: 'male', label: '👨 Male (Männlich)' },
  { value: 'diverse', label: '🌈 Diverse' },
  { value: 'prefer_not_to_say', label: '🔒 Prefer not to say' },
];

const Profile = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Form state for editing
  const [formData, setFormData] = useState({
    nickname: '',
    age: null as number | null,
    gender: null as string | null,
    vacation_mode: false,
    notification_radius: 1000,
    allergens: [] as string[],
    dislikes: [] as string[],
    languages: ['de'] as string[],
    phone_number: '',
    private_address: '',
    private_city: '',
    private_postal_code: '',
    partner_photo_url: '',
    partner_name: '',
    partner_gender: null as string | null,
  });

  const [customLanguageInput, setCustomLanguageInput] = useState('');

  // Fetch current user and profile
  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return null;
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      return { ...user, profile };
    },
  });

  // Check if user is admin
  const { data: isAdmin } = useQuery({
    queryKey: ['isAdmin', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return false;
      
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUser.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      return !!roles;
    },
    enabled: !!currentUser?.id,
  });

  // Fetch chef's wallet balance
  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ['chefWallet', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return { balance: 0, requestedAmount: 0 };
      
      // Get all bookings where this user is the chef and payout_status is 'accumulating'
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('payment_amount, meal_id, meals!inner(chef_id)')
        .eq('meals.chef_id', currentUser.id)
        .eq('payout_status', 'accumulating');
      
      if (error) throw error;
      
      // Calculate balance (payment_amount - 10% platform fee)
      const balance = bookings?.reduce((sum, booking) => {
        const amount = booking.payment_amount || 0;
        const netAmount = amount * 0.9; // Chef gets 90%, platform takes 10%
        return sum + netAmount;
      }, 0) || 0;
      
      // Get requested amount
      const { data: requestedBookings } = await supabase
        .from('bookings')
        .select('payment_amount, meal_id, meals!inner(chef_id)')
        .eq('meals.chef_id', currentUser.id)
        .eq('payout_status', 'requested');
      
      const requestedAmount = requestedBookings?.reduce((sum, booking) => {
        const amount = booking.payment_amount || 0;
        const netAmount = amount * 0.9;
        return sum + netAmount;
      }, 0) || 0;
      
      return { balance, requestedAmount };
    },
    enabled: !!currentUser?.id,
  });

  // Initialize form data when profile loads
  useEffect(() => {
    if (currentUser?.profile) {
      setFormData({
        nickname: currentUser.profile.nickname || '',
        age: currentUser.profile.age || null,
        gender: currentUser.profile.gender || null,
        vacation_mode: currentUser.profile.vacation_mode || false,
        notification_radius: currentUser.profile.notification_radius || 1000,
        allergens: currentUser.profile.allergens || [],
        dislikes: currentUser.profile.dislikes || [],
        languages: currentUser.profile.languages || ['de'],
        phone_number: currentUser.profile.phone_number || '',
        private_address: currentUser.profile.private_address || '',
        private_city: currentUser.profile.private_city || '',
        private_postal_code: currentUser.profile.private_postal_code || '',
        partner_photo_url: currentUser.profile.partner_photo_url || '',
        partner_name: currentUser.profile.partner_name || '',
        partner_gender: currentUser.profile.partner_gender || null,
      });
    }
  }, [currentUser]);

  // Geocoding helper function
  const getCoordinates = async (address: string): Promise<{ lat: number; lon: number } | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`,
        { headers: { "User-Agent": "NeighborsKitchen/1.0" } }
      );
      const data = await response.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
      }
    } catch (error) {
      console.error("Geocoding failed:", error);
    }
    return null;
  };

  // Update profile mutation (including IBAN)
  const updateProfileMutation = useMutation({
    mutationFn: async (ibanUpdate?: string) => {
      if (!currentUser?.id) throw new Error('Not authenticated');
      
      let latitude = currentUser.profile?.latitude || null;
      let longitude = currentUser.profile?.longitude || null;

      // Check if address fields have changed
      const addressChanged = 
        formData.private_address !== currentUser.profile?.private_address ||
        formData.private_city !== currentUser.profile?.private_city ||
        formData.private_postal_code !== currentUser.profile?.private_postal_code;

      // Geocode address if it has changed and is complete
      if (addressChanged && formData.private_address && formData.private_city) {
        const fullAddress = `${formData.private_address}, ${formData.private_postal_code || ''} ${formData.private_city}, Switzerland`.trim();
        console.log('Geocoding address:', fullAddress);
        
        const coords = await getCoordinates(fullAddress);
        
        if (coords) {
          latitude = coords.lat;
          longitude = coords.lon;
          console.log('Address geocoded successfully:', { latitude, longitude });
        } else {
          // Address not found - warn user but still allow save
          toast.error(t('toast.address_geocode_failed'), {
            duration: 5000,
          });
          console.warn('Geocoding returned no results for:', fullAddress);
          // Keep existing coordinates if any, or set to null
          latitude = null;
          longitude = null;
        }
      }
      
      const updateData: any = {
        nickname: formData.nickname || null,
        age: formData.age || null,
        gender: formData.gender || null,
        vacation_mode: formData.vacation_mode,
        notification_radius: formData.notification_radius,
        allergens: formData.allergens,
        dislikes: formData.dislikes,
        languages: formData.languages,
        phone_number: formData.phone_number || null,
        private_address: formData.private_address || null,
        private_city: formData.private_city || null,
        private_postal_code: formData.private_postal_code || null,
        partner_photo_url: formData.partner_photo_url || null,
        partner_name: formData.partner_name || null,
        partner_gender: formData.partner_gender || null,
        latitude,
        longitude,
      };

      if (ibanUpdate !== undefined) {
        updateData.iban = ibanUpdate;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', currentUser.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('✅ Gespeichert');
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['chefWallet'] });
    },
    onError: (error: any) => {
      toast.error(error.message || t('toast.profile_update_failed'));
    },
  });

  // Request payout mutation
  const requestPayoutMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.id) throw new Error('Not authenticated');
      
      // First get all meal IDs for this chef
      const { data: meals } = await supabase
        .from('meals')
        .select('id')
        .eq('chef_id', currentUser.id);
      
      if (!meals || meals.length === 0) return;
      
      const mealIds = meals.map(m => m.id);
      
      // Update all 'accumulating' bookings to 'requested'
      const { error } = await supabase
        .from('bookings')
        .update({ payout_status: 'requested' })
        .eq('payout_status', 'accumulating')
        .in('meal_id', mealIds);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Auszahlung beantragt! Wir überweisen innerhalb von 7 Tagen.');
      queryClient.invalidateQueries({ queryKey: ['chefWallet'] });
    },
    onError: (error: any) => {
      toast.error('Fehler beim Beantragen der Auszahlung: ' + error.message);
    },
  });

  const toggleLanguage = (languageCode: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(languageCode)
        ? prev.languages.filter(l => l !== languageCode)
        : [...prev.languages, languageCode]
    }));
    
    // Set UI language to first selected language
    const primaryLanguage = formData.languages.includes(languageCode) 
      ? formData.languages.find(l => l !== languageCode) || 'de'
      : languageCode;
    
    localStorage.setItem('language', primaryLanguage);
    i18n.changeLanguage(primaryLanguage);
  };

  const toggleAllergen = (allergen: string) => {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter(a => a !== allergen)
        : [...prev.allergens, allergen]
    }));
  };

  const toggleDislike = (dislike: string) => {
    setFormData(prev => ({
      ...prev,
      dislikes: prev.dislikes.includes(dislike)
        ? prev.dislikes.filter(d => d !== dislike)
        : [...prev.dislikes, dislike]
    }));
  };

  const handleCustomLanguageRequest = async () => {
    if (!customLanguageInput.trim() || !currentUser?.id) return;
    
    try {
      const { error } = await supabase
        .from('language_requests')
        .insert({
          language_name: customLanguageInput.trim(),
          requested_by_user_id: currentUser.id
        });
      
      if (error) throw error;
      
      toast.success(t('toast.language_request_submitted', { language: customLanguageInput }));
      setCustomLanguageInput('');
    } catch (error) {
      console.error('Error submitting language request:', error);
      toast.error(t('toast.language_request_failed'));
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  const profile = currentUser.profile;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Vertrauen & Sicherheit Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Vertrauen &amp; Sicherheit
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile?.verification_status === 'approved' || profile?.id_verified ? (
              <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="text-2xl">✅</div>
                <div>
                  <p className="font-semibold text-green-600 dark:text-green-400">Verifiziertes Profil</p>
                  <p className="text-xs text-muted-foreground">Du hast den blauen Haken erhalten</p>
                </div>
              </div>
            ) : profile?.verification_status === 'pending' ? (
              <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="text-2xl">⏳</div>
                <div>
                  <p className="font-semibold text-yellow-600 dark:text-yellow-400">Überprüfung läuft...</p>
                  <p className="text-xs text-muted-foreground">Wir prüfen deine Verifizierung</p>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Lade ein Foto mit deinem Ausweis hoch, um dein Profil zu verifizieren und das ✓ Badge zu erhalten.
                </p>
                <VerificationDialog
                  userId={currentUser.id}
                  verificationStatus={profile?.verification_status || 'pending'}
                  onSuccess={() => queryClient.invalidateQueries({ queryKey: ['currentUser'] })}
                />
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Admin Dashboard Access */}
        {isAdmin && (
          <Card 
            className="mb-6 border-blue-600 bg-blue-950/20 hover:bg-blue-950/30 cursor-pointer transition-colors"
            onClick={() => navigate('/admin')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-blue-100">Admin Dashboard</h3>
                  <p className="text-sm text-blue-300/80">
                    Verifizierungen, Statistik & Meldungen
                  </p>
                </div>
                <div className="text-blue-400">→</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chef Wallet Section */}
        <Card className="mb-6 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💰 Dein Guthaben / Wallet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {walletLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="text-center py-6 bg-background/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Verfügbares Guthaben</p>
                  <p className="text-4xl font-bold text-primary">
                    CHF {walletData?.balance.toFixed(2) || '0.00'}
                  </p>
                  {walletData && walletData.requestedAmount > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      🕐 CHF {walletData.requestedAmount.toFixed(2)} in Bearbeitung
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="iban">IBAN für Auszahlung</Label>
                    <Input
                      id="iban"
                      type="text"
                      placeholder="CH00 0000 0000 0000 0000 0"
                      defaultValue={profile?.iban || ''}
                      onBlur={(e) => {
                        if (e.target.value !== profile?.iban) {
                          updateProfileMutation.mutate(e.target.value);
                        }
                      }}
                    />
                  </div>

                  <Button
                    onClick={() => requestPayoutMutation.mutate()}
                    disabled={
                      !walletData || 
                      walletData.balance < 10 || 
                      !profile?.iban || 
                      requestPayoutMutation.isPending
                    }
                    className="w-full"
                  >
                    {requestPayoutMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Wird beantragt...
                      </>
                    ) : (
                      'Auszahlung beantragen'
                    )}
                  </Button>

                  <Alert>
                    <AlertDescription className="text-xs">
                      💡 <strong>Info:</strong> Dein Guthaben sammelt sich hier. Du kannst es dir ab CHF 10.- auf deine hinterlegte IBAN auszahlen lassen. Wir überweisen 1x monatlich gebündelt.
                    </AlertDescription>
                  </Alert>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Verification Incentive Banner */}
        {!profile?.id_verified && !profile?.phone_verified && (
          <Alert className="mb-6 border-primary bg-primary/10">
            <Shield className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              <strong>{t('profile.verification_banner')}</strong> {t('profile.verification_banner_desc')}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            {/* Avatar Warning */}
            {!profile?.avatar_url && (
              <Alert className="mb-4 border-orange-500 bg-orange-50 dark:bg-orange-950/20">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-sm text-orange-800 dark:text-orange-300">
                  <strong>⚠️ Ohne Profilbild kannst du nicht bestellen.</strong> Das schafft Vertrauen in unserer Nachbarschaft!
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex items-center gap-4 mb-4">
              {/* Main User Avatar */}
              <div className="relative w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-3xl overflow-hidden group">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Dein Profilbild" className="w-full h-full object-cover" />
                ) : (
                  <span>👤</span>
                )}
                <label 
                  htmlFor="avatar-upload" 
                  className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Dein Profilbild"
                >
                  <Upload className="w-6 h-6 text-white" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    if (file.size > 5 * 1024 * 1024) {
                      toast.error('Datei zu groß (max 5MB)');
                      return;
                    }

                    if (!file.type.startsWith('image/')) {
                      toast.error('Nur Bilder sind erlaubt');
                      return;
                    }

                    try {
                      const fileExt = file.name.split('.').pop();
                      const fileName = `${currentUser.id}-avatar-${Date.now()}.${fileExt}`;

                      const { error: uploadError } = await supabase.storage
                        .from('gallery')
                        .upload(fileName, file);

                      if (uploadError) throw uploadError;

                      const { data } = supabase.storage
                        .from('gallery')
                        .getPublicUrl(fileName);

                      await supabase
                        .from('profiles')
                        .update({ avatar_url: data.publicUrl })
                        .eq('id', currentUser.id);

                      toast.success('Profilbild aktualisiert!');
                      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
                    } catch (error) {
                      console.error('Upload error:', error);
                      toast.error('Fehler beim Hochladen');
                    }
                  }}
                />
              </div>
              
              {/* Partner Avatar (if couple) */}
              {profile?.is_couple && (
                <div className="space-y-1">
                  <div className="relative w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center text-3xl overflow-hidden group border-2 border-dashed border-border">
                    {profile?.partner_photo_url ? (
                      <img src={profile.partner_photo_url} alt="Partner Foto" className="w-full h-full object-cover" />
                    ) : (
                      <span>👥</span>
                    )}
                    <label 
                      htmlFor="partner-avatar-upload" 
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Partner Foto"
                    >
                      <Upload className="w-6 h-6 text-white" />
                    </label>
                  <input
                    id="partner-avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      if (file.size > 5 * 1024 * 1024) {
                        toast.error('Datei zu groß (max 5MB)');
                        return;
                      }

                      if (!file.type.startsWith('image/')) {
                        toast.error('Nur Bilder sind erlaubt');
                        return;
                      }

                      try {
                        const fileExt = file.name.split('.').pop();
                        const fileName = `${currentUser.id}-partner-${Date.now()}.${fileExt}`;

                        const { error: uploadError } = await supabase.storage
                          .from('gallery')
                          .upload(fileName, file);

                        if (uploadError) throw uploadError;

                        const { data } = supabase.storage
                          .from('gallery')
                          .getPublicUrl(fileName);

                        await supabase
                          .from('profiles')
                          .update({ partner_photo_url: data.publicUrl })
                          .eq('id', currentUser.id);

                        toast.success('Partner Foto aktualisiert!');
                        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
                      } catch (error) {
                        console.error('Upload error:', error);
                        toast.error('Fehler beim Hochladen');
                      }
                    }}
                  />
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center max-w-[80px]">
                    💡 Bei Paaren: Foto von euch beiden, damit Nachbarn wissen, wer an der Tür stehen könnte
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  {profile?.first_name} {profile?.last_name}
                  {(profile?.id_verified || profile?.phone_verified) && (
                    <span className="text-blue-500" title="Verified User">✓</span>
                  )}
                </h2>
                <p className="text-sm text-muted-foreground">
                  @{formData.nickname || profile?.first_name || 'User'}
                </p>
                <div className="flex items-center gap-2 mt-1" data-tour="karma">
                  <Star className="w-5 h-5 text-trust-gold fill-current" />
                  <span className="text-lg font-semibold text-trust-gold">
                    {profile?.karma || 0} {t('profile.karma')}
                  </span>
                 </div>
               </div>

             <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">0</p>
                <p className="text-xs text-muted-foreground">{t('profile.mealsShared')}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-secondary">0</p>
                <p className="text-xs text-muted-foreground">{t('profile.mealsReceived')}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-trust-badge">0</p>
                <p className="text-xs text-muted-foreground">{t('profile.fairPayments')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Persönliche Angaben */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Persönliche Angaben</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="nickname">Spitzname</Label>
              <Input
                id="nickname"
                type="text"
                placeholder="Wie Nachbarn dich nennen sollen"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="name-privacy">Anzeigename / Privatsphäre</Label>
              <Select
                defaultValue="first_initial"
              >
                <SelectTrigger id="name-privacy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-border z-50">
                  <SelectItem value="full_name">Voller Name (Max Mustermann)</SelectItem>
                  <SelectItem value="first_initial">Vorname & Initiale (Max M.)</SelectItem>
                  <SelectItem value="nickname_only">Nur Spitzname (@{formData.nickname || 'Max123'})</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                💡 Steuert, wie dein Name auf Mahlzeit-Karten angezeigt wird
              </p>
            </div>
            <div>
              <Label htmlFor="age">Alter (Optional)</Label>
              <Input
                id="age"
                type="number"
                placeholder="Dein Alter"
                value={formData.age || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  age: e.target.value ? parseInt(e.target.value) : null 
                })}
              />
            </div>
            
            <div>
              <Label htmlFor="gender">Geschlecht (für Sicherheitsfunktionen)</Label>
              <Select
                value={formData.gender || undefined}
                onValueChange={(value) => setFormData({ ...formData, gender: value })}
              >
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Geschlecht auswählen..." />
                </SelectTrigger>
                <SelectContent className="bg-background border-border z-50">
                  {genderOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.gender === 'female' && (
                <p className="text-xs text-muted-foreground mt-1">
                  💡 Ermöglicht "Ladies Only"-Modus für Köchinnen
                </p>
              )}
            </div>
            
            {/* Partner-Angaben (Nur für Paare) */}
            {profile?.is_couple && (
              <div className="pt-4 border-t border-border space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-5 h-5 text-primary" />
                  <Label className="text-base font-semibold">Partner-Angaben (Pflichtfeld für Paare)</Label>
                </div>
                
                <div>
                  <Label htmlFor="partner-photo">Partner Foto (optional via URL)</Label>
                  <Input
                    id="partner-photo"
                    type="text"
                    placeholder="https://... (oder nutze Upload oben)"
                    value={formData.partner_photo_url}
                    onChange={(e) => setFormData({ ...formData, partner_photo_url: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 Du kannst das Foto auch oben im Profilbereich hochladen
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="partner-name">Partner's Name</Label>
                  <Input
                    id="partner-name"
                    type="text"
                    placeholder="Partner's first name"
                    value={formData.partner_name}
                    onChange={(e) => setFormData({ ...formData, partner_name: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="partner-gender">Partner's Gender</Label>
                  <Select
                    value={formData.partner_gender || undefined}
                    onValueChange={(value) => setFormData({ ...formData, partner_gender: value })}
                  >
                    <SelectTrigger id="partner-gender">
                      <SelectValue placeholder="Select partner's gender..." />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border z-50">
                      {genderOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 For "Ladies Only" bookings, the female partner must attend
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Verification & Location */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Verifizierung & Standort
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="phone">{t('profile.settings_mobile')}</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+41 79 123 45 67"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="address">{t('profile.settings_address')}</Label>
              <Input
                id="address"
                type="text"
                placeholder="Steinenvorstadt 25"
                value={formData.private_address}
                onChange={(e) => setFormData({ ...formData, private_address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="zip">{t('profile.settings_zip')}</Label>
                <Input
                  id="zip"
                  type="text"
                  placeholder="4051"
                  value={formData.private_postal_code}
                  onChange={(e) => setFormData({ ...formData, private_postal_code: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="city">{t('profile.settings_city')}</Label>
                <Input
                  id="city"
                  type="text"
                  placeholder="Basel"
                  value={formData.private_city}
                  onChange={(e) => setFormData({ ...formData, private_city: e.target.value })}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('profile.settings_address_hint')}
            </p>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('profile.settings_preferences')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="vacation-mode" className="text-base">{t('profile.settings_vacation_mode')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('profile.settings_vacation_desc')}
                </p>
              </div>
              <Switch
                id="vacation-mode"
                checked={formData.vacation_mode}
                onCheckedChange={(checked) => setFormData({ ...formData, vacation_mode: checked })}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="notification-radius">{t('profile.settings_notification_radius')}</Label>
                <span className="text-sm font-medium text-primary">
                  {(formData.notification_radius / 1000).toFixed(1)} km
                </span>
              </div>
              
              {profile?.latitude && profile?.longitude ? (
                <RadiusSliderMap 
                  lat={profile.latitude}
                  lng={profile.longitude}
                  radius={formData.notification_radius / 1000}
                />
              ) : (
                <div className="w-full h-48 rounded-lg border border-border bg-muted flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Add your address to see the map</p>
                </div>
              )}
              
              <Slider
                id="notification-radius"
                min={100}
                max={5000}
                step={100}
                value={[formData.notification_radius]}
                onValueChange={([value]) => setFormData({ ...formData, notification_radius: value })}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                You'll be notified about meals within this radius from your location
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Safety Shield - Dietary Preferences */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-destructive" />
              {t('profile.settings_safety_title')}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('profile.settings_safety_desc')}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-base font-semibold mb-3 block">{t('profile.settings_allergens')}</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {allergenOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`allergen-${option.value}`}
                      checked={formData.allergens.includes(option.value)}
                      onCheckedChange={() => toggleAllergen(option.value)}
                    />
                    <Label
                      htmlFor={`allergen-${option.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-4 border-t border-border">
              <Label className="text-base font-semibold mb-3 block">{t('profile.settings_dislikes')}</Label>
              <Accordion type="multiple" className="w-full">
                {Object.entries(dislikeCategories).map(([category, items]) => (
                  <AccordionItem key={category} value={category}>
                    <AccordionTrigger className="text-sm capitalize">
                      {category} ({items.filter(item => formData.dislikes.includes(item.value)).length}/{items.length})
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pt-2">
                        {items.map((dislike) => (
                          <div key={dislike.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`dislike-${dislike.value}`}
                              checked={formData.dislikes.includes(dislike.value)}
                              onCheckedChange={() => toggleDislike(dislike.value)}
                            />
                            <Label
                              htmlFor={`dislike-${dislike.value}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {dislike.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </CardContent>
        </Card>

        {/* Language Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              {t('profile.languagePreference')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Label className="text-base font-semibold">{t('profile.languagePreference')}</Label>
              <div className="grid grid-cols-2 gap-3">
                {languages.map((lang) => (
                  <div key={lang.code} className="flex items-center space-x-2">
                    <Checkbox
                      id={`language-${lang.code}`}
                      checked={formData.languages.includes(lang.code)}
                      onCheckedChange={() => toggleLanguage(lang.code)}
                    />
                    <Label
                      htmlFor={`language-${lang.code}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {lang.name}
                    </Label>
                  </div>
                ))}
              </div>
              
              <div className="pt-3 border-t border-border">
                <Label className="text-sm font-medium mb-2 block">{t('profile.settings_language_missing')}</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder={t('profile.settings_language_request_placeholder')}
                    value={customLanguageInput}
                    onChange={(e) => setCustomLanguageInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCustomLanguageRequest();
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    onClick={handleCustomLanguageRequest} 
                    variant="outline"
                    disabled={!customLanguageInput.trim()}
                  >
                    {t('profile.settings_language_request')}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('profile.settings_language_popular')}
                </p>
              </div>
              
              <p className="text-xs text-muted-foreground mt-2">
                {t('profile.settings_language_translation')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-trust-gold" />
              {t('profile.achievements_title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary-light p-4 rounded-lg text-center">
                <ChefHat className="w-8 h-8 mx-auto mb-2 text-secondary" />
                <p className="font-semibold text-sm text-foreground">{t('profile.achievements_chef_master')}</p>
                <p className="text-xs text-muted-foreground">{t('profile.achievements_chef_master_desc')}</p>
              </div>
              <div className="bg-primary-light p-4 rounded-lg text-center">
                <Heart className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="font-semibold text-sm text-foreground">{t('profile.achievements_fair_payer')}</p>
                <p className="text-xs text-muted-foreground">{t('profile.achievements_fair_payer_desc')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trust System Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('profile.karma_title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                <ChefHat className="w-4 h-4 text-secondary" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">{t('profile.karma_share')}</p>
                <p className="text-xs text-muted-foreground">{t('profile.karma_share_desc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Heart className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">{t('profile.karma_pay')}</p>
                <p className="text-xs text-muted-foreground">{t('profile.karma_pay_desc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-trust-badge/10 flex items-center justify-center flex-shrink-0">
                <Star className="w-4 h-4 text-trust-gold" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">{t('profile.karma_respect')}</p>
                <p className="text-xs text-muted-foreground">{t('profile.karma_respect_desc')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chef Portfolio Gallery */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-primary" />
              {t('profile.gallery_title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('profile.gallery_desc')}
            </p>
            <GalleryUpload userId={currentUser.id} />
            <GalleryGrid userId={currentUser.id} isOwnProfile={true} />
          </CardContent>
        </Card>

        {/* Blocked Users Management */}
        <BlockedUsersList currentUserId={currentUser.id} />

        {/* App-Feedback / Fehlerberichte */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Hilf uns zu verbessern</CardTitle>
          </CardHeader>
          <CardContent>
            <FeedbackDialog userId={currentUser.id} />
          </CardContent>
        </Card>

        {/* Community Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle>{t('profile.communityGuidelines')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{t('guidelines.bringContainer')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{t('guidelines.bePunctual')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{t('guidelines.payFairly')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{t('guidelines.respectPrivacy')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{t('guidelines.communicate')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{t('guidelines.leaveFeedback')}</span>
              </li>
            </ul>
            
            {/* Disclaimer */}
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-foreground leading-relaxed">
                {t('guidelines.disclaimer')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account Management - Danger Zone */}
        <Card className="mb-6 border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Gefahrenzone / Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Button
                variant="outline"
                className="w-full border-destructive/50 hover:bg-destructive/10"
                onClick={async () => {
                  if (!confirm('⚠️ Möchtest du dein Konto wirklich deaktivieren? Deine Daten bleiben gespeichert, aber du bist für andere unsichtbar.')) return;
                  
                  try {
                    await supabase
                      .from('profiles')
                      .update({ vacation_mode: true })
                      .eq('id', currentUser.id);
                    
                    toast.success('Konto deaktiviert. Aktiviere es in den Einstellungen wieder.');
                    queryClient.invalidateQueries({ queryKey: ['currentUser'] });
                  } catch (error: any) {
                    toast.error('Fehler: ' + error.message);
                  }
                }}
              >
                Konto deaktivieren
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                Dein Profil wird versteckt, Daten bleiben erhalten
              </p>
            </div>

            <div>
              <Button
                variant="destructive"
                className="w-full"
                onClick={async () => {
                  const confirmation = prompt('⚠️ UNWIDERRUFLICH! Tippe "DELETE" um dein Konto endgültig zu löschen:');
                  if (confirmation !== 'DELETE') {
                    toast.error('Abgebrochen. Du musst "DELETE" exakt eingeben.');
                    return;
                  }
                  
                  try {
                    // Delete user data from profiles table
                    const { error: profileError } = await supabase
                      .from('profiles')
                      .delete()
                      .eq('id', currentUser.id);
                    
                    if (profileError) throw profileError;
                    
                    // Sign out and redirect
                    await supabase.auth.signOut();
                    toast.success('Konto erfolgreich gelöscht. Auf Wiedersehen.');
                    navigate('/');
                  } catch (error: any) {
                    toast.error('Fehler beim Löschen: ' + error.message);
                  }
                }}
              >
                ⚠️ Konto unwiderruflich löschen
              </Button>
              <p className="text-xs text-destructive mt-1">
                ⚠️ Achtung: Dein Konto wird unwiderruflich gelöscht. ALLE Daten werden permanent entfernt! Wenn du später zurückkommst, musst du dich erneut verifizieren (Ausweis/Foto). Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="mt-6">
          <Button 
            onClick={() => updateProfileMutation.mutate(undefined)}
            disabled={updateProfileMutation.isPending}
            className="w-full"
            size="lg"
          >
            {updateProfileMutation.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            {updateProfileMutation.isPending ? 'Speichern...' : 'Profil speichern'}
          </Button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;
