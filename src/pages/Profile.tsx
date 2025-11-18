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
import { Star, Award, ChefHat, Heart, Globe, Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { allergenOptions, dislikeCategories } from '@/utils/ingredientDatabase';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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

const Profile = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Form state for editing
  const [formData, setFormData] = useState({
    nickname: '',
    age: null as number | null,
    vacation_mode: false,
    notification_radius: 1000,
    allergens: [] as string[],
    dislikes: [] as string[],
    languages: ['de'] as string[],
    phone_number: '',
    private_address: '',
    private_city: '',
    private_postal_code: '',
  });

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
        vacation_mode: currentUser.profile.vacation_mode || false,
        notification_radius: currentUser.profile.notification_radius || 1000,
        allergens: currentUser.profile.allergens || [],
        dislikes: currentUser.profile.dislikes || [],
        languages: currentUser.profile.languages || ['de'],
        phone_number: currentUser.profile.phone_number || '',
        private_address: currentUser.profile.private_address || '',
        private_city: currentUser.profile.private_city || '',
        private_postal_code: currentUser.profile.private_postal_code || '',
      });
    }
  }, [currentUser]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.id) throw new Error('Not authenticated');
      
      let latitude = null;
      let longitude = null;

      // Geocode address if provided
      if (formData.private_address && formData.private_city) {
        try {
          const { data: geoData, error: geoError } = await supabase.functions.invoke('geocode-address', {
            body: {
              street: formData.private_address,
              city: formData.private_city,
              postalCode: formData.private_postal_code,
            },
          });

          if (!geoError && geoData?.latitude && geoData?.longitude) {
            latitude = geoData.latitude;
            longitude = geoData.longitude;
            console.log('Address geocoded:', { latitude, longitude });
          } else {
            console.warn('Geocoding failed, proceeding without coordinates');
          }
        } catch (geoError) {
          console.error('Geocoding error:', geoError);
          // Continue without geocoding - don't block profile update
        }
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({
          nickname: formData.nickname || null,
          age: formData.age || null,
          vacation_mode: formData.vacation_mode,
          notification_radius: formData.notification_radius,
          allergens: formData.allergens,
          dislikes: formData.dislikes,
          languages: formData.languages,
          phone_number: formData.phone_number || null,
          private_address: formData.private_address || null,
          private_city: formData.private_city || null,
          private_postal_code: formData.private_postal_code || null,
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
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-3xl">
                👤
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground">
                  {profile?.first_name} {profile?.last_name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  @{formData.nickname || profile?.first_name || 'User'}
                </p>
                <div className="flex items-center gap-2 mt-1">
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

        {/* Personal Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Personal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="nickname">Nickname</Label>
              <Input
                id="nickname"
                type="text"
                placeholder="How neighbors should call you"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="age">Age (Optional)</Label>
              <Input
                id="age"
                type="number"
                placeholder="Your age"
                value={formData.age || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  age: e.target.value ? parseInt(e.target.value) : null 
                })}
              />
            </div>
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
                  {formData.notification_radius}m
                </span>
              </div>
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
              <div className="space-y-3">
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
            {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;
