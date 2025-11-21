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
import { Star, Award, ChefHat, Heart, Globe, Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { allergenOptions, dislikeCategories } from '@/utils/ingredientDatabase';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import RadiusSliderMap from '@/components/maps/RadiusSliderMap';
import GalleryUpload from '@/components/GalleryUpload';
import GalleryGrid from '@/components/GalleryGrid';
import { BlockedUsersList } from '@/components/BlockedUsersList';
import { FeedbackDialog } from '@/components/FeedbackDialog';

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

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
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
          toast.error('Address could not be located on the map. Please check spelling.', {
            duration: 5000,
          });
          console.warn('Geocoding returned no results for:', fullAddress);
          // Keep existing coordinates if any, or set to null
          latitude = null;
          longitude = null;
        }
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({
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
        })
        .eq('id', currentUser.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update profile');
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
      
      toast.success(`Language request "${customLanguageInput}" submitted! We'll add it if there's demand.`);
      setCustomLanguageInput('');
    } catch (error) {
      console.error('Error submitting language request:', error);
      toast.error('Failed to submit language request');
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
        {/* Verification Incentive Banner */}
        {!profile?.id_verified && !profile?.phone_verified && (
          <Alert className="mb-6 border-primary bg-primary/10">
            <Shield className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              <strong>Get Verified to increase your booking chances!</strong> Verified users get a blue tick badge and more trust from the community.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Profile Header */}
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-3xl">
                👤
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
              <p className="text-xs text-muted-foreground mt-1">
                💡 Ermöglicht "Ladies Only"-Modus für Köchinnen
              </p>
            </div>
            
            {/* Partner-Angaben (Nur für Paare) */}
            {profile?.is_couple && (
              <div className="pt-4 border-t border-border space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-5 h-5 text-primary" />
                  <Label className="text-base font-semibold">Partner-Angaben (Pflichtfeld für Paare)</Label>
                </div>
                
                <div>
                  <Label htmlFor="partner-photo">Partner Foto-URL</Label>
                  <Input
                    id="partner-photo"
                    type="text"
                    placeholder="https://..."
                    value={formData.partner_photo_url}
                    onChange={(e) => setFormData({ ...formData, partner_photo_url: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    📸 Required for verification and safety
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
              <Label htmlFor="phone">Mobile Number (for coordination)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+41 79 123 45 67"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="address">Street & Number</Label>
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
                <Label htmlFor="zip">Zip Code</Label>
                <Input
                  id="zip"
                  type="text"
                  placeholder="4051"
                  value={formData.private_postal_code}
                  onChange={(e) => setFormData({ ...formData, private_postal_code: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
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
              💡 This address defines your center for the Meal Radar.
            </p>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="vacation-mode" className="text-base">Vacation Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Pause all notifications and hide my meals
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
                <Label htmlFor="notification-radius">Notification Radius</Label>
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
              Safety Shield (Private)
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              This information is private and only used to warn you about allergens in meals
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-base font-semibold mb-3 block">Allergens</Label>
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
              <Label className="text-base font-semibold mb-3 block">Dislikes (Accordion)</Label>
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
                <Label className="text-sm font-medium mb-2 block">Missing your language?</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="➕ Request language (e.g., Korean, Hindi)"
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
                    Request
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  🌍 We'll add popular requested languages!
                </p>
              </div>
              
              <p className="text-xs text-muted-foreground mt-2">
                💬 {t('profile.languagePreference')} - Messages with chefs who speak different languages will be automatically translated for you
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-trust-gold" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary-light p-4 rounded-lg text-center">
                <ChefHat className="w-8 h-8 mx-auto mb-2 text-secondary" />
                <p className="font-semibold text-sm text-foreground">Chef Master</p>
                <p className="text-xs text-muted-foreground">20+ meals shared</p>
              </div>
              <div className="bg-primary-light p-4 rounded-lg text-center">
                <Heart className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="font-semibold text-sm text-foreground">Fair Payer</p>
                <p className="text-xs text-muted-foreground">Always pays fairly</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trust System Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>About Karma Points</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                <ChefHat className="w-4 h-4 text-secondary" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">Share Meals</p>
                <p className="text-xs text-muted-foreground">Earn karma by sharing your cooking</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Heart className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">Pay Fairly</p>
                <p className="text-xs text-muted-foreground">Build trust by fair payments</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-trust-badge/10 flex items-center justify-center flex-shrink-0">
                <Star className="w-4 h-4 text-trust-gold" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">Be Respectful</p>
                <p className="text-xs text-muted-foreground">Respect hosts and bring your own container</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chef Portfolio Gallery */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-primary" />
              My Food Gallery
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Show off your cooking skills! Upload photos of your meals to build trust with neighbors.
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

        {/* Save Button */}
        <div className="mt-6">
          <Button 
            onClick={() => updateProfileMutation.mutate()}
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
