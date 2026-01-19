import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ChefHat, Upload, X, Globe } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

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

const Signup = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [accountType, setAccountType] = useState<'single' | 'couple'>('single');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([i18n.language || 'de']);
  const [requestedLanguage, setRequestedLanguage] = useState('');
  const [partnerPhotoFile, setPartnerPhotoFile] = useState<File | null>(null);
  const [partnerPhotoPreview, setPartnerPhotoPreview] = useState<string>('');
  const [uploadingPartnerPhoto, setUploadingPartnerPhoto] = useState(false);
  const [avatarPhotoFile, setAvatarPhotoFile] = useState<File | null>(null);
  const [avatarPhotoPreview, setAvatarPhotoPreview] = useState<string>('');
  const [uploadingAvatarPhoto, setUploadingAvatarPhoto] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    gender: '',
    isCouple: false,
    partnerName: '',
    partnerGender: '',
    partnerPhotoUrl: '',
    avatarUrl: '',
    phoneNumber: '',
    address: '',
    city: '',
    postalCode: '',
    visibilityMode: 'all' as 'all' | 'women_fli' | 'women_only',
  });
  const [selfDeclarationChecked, setSelfDeclarationChecked] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    const pwd = formData.password;
    if (pwd.length === 0) return { level: 0, label: '', color: '' };
    
    if (pwd.length < 6) {
      return { level: 25, label: t('signup.password_too_short'), color: 'bg-red-500' };
    }
    
    const hasNumber = /\d/.test(pwd);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
    
    if (pwd.length >= 10 && hasNumber && hasSpecialChar) {
      return { level: 100, label: t('signup.password_strong'), color: 'bg-green-500' };
    }
    
    if (pwd.length >= 8 && hasNumber) {
      return { level: 65, label: t('signup.password_medium'), color: 'bg-yellow-500' };
    }
    
    return { level: 40, label: t('signup.password_weak'), color: 'bg-orange-500' };
  }, [formData.password, t]);

  // Handle partner photo select and preview (WITHOUT immediate upload - uploaded after auth)
  const handlePartnerPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('signup.file_too_large'));
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error(t('signup.images_only'));
      return;
    }

    setPartnerPhotoFile(file);
    setPartnerPhotoPreview(URL.createObjectURL(file));
  };

  // Handle avatar photo select and preview (without immediate upload)
  const handleAvatarPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('signup.file_too_large'));
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error(t('signup.images_only'));
      return;
    }

    setAvatarPhotoFile(file);
    setAvatarPhotoPreview(URL.createObjectURL(file));
  };

  const toggleLanguage = (langCode: string) => {
    setSelectedLanguages(prev => 
      prev.includes(langCode) 
        ? prev.filter(l => l !== langCode)
        : [...prev, langCode]
    );
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation: Check if self-declaration is required and checked
    if ((formData.visibilityMode === 'women_fli' || formData.visibilityMode === 'women_only') && !selfDeclarationChecked) {
      toast.error(t('signup.selfDeclarationRequired'));
      return;
    }
    
    setLoading(true);

    try {
      // Step 1: Create Auth User
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            languages: selectedLanguages,
            gender: formData.gender,
            is_couple: formData.isCouple,
          },
        },
      });

      // AUTO-RECOVERY: If user already exists, try to log them in and repair profile
      if (error && (error.message.includes('already registered') || error.message.includes('User already registered'))) {
        console.log('User already exists, attempting auto-recovery...');
        
        // Try to log them in
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (loginError) {
          setLoading(false);
          toast.error('Dieses Konto existiert bereits, aber das Passwort ist falsch. Bitte melde dich an.', {
            duration: 10000,
          });
          return; // Don't navigate, let user see the message
        }

        if (!loginData.user) {
          setLoading(false);
          toast.error('Anmeldung fehlgeschlagen. Bitte versuche es erneut.', {
            duration: 10000,
          });
          return;
        }

        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', loginData.user.id)
          .maybeSingle();

        // REPAIR: If profile is missing, create it (Emergency Profile Creation)
        if (!existingProfile) {
          console.log('Orphan user detected! Creating emergency profile...');
          const { error: repairError } = await supabase
            .from('profiles')
            .upsert({
              id: loginData.user.id,
              first_name: formData.firstName,
              last_name: formData.lastName,
              languages: selectedLanguages,
              gender: formData.gender || null,
              is_couple: formData.isCouple,
              partner_name: formData.isCouple ? formData.partnerName : null,
              partner_gender: formData.isCouple ? formData.partnerGender : null,
              partner_photo_url: formData.isCouple ? formData.partnerPhotoUrl : null,
              phone_number: formData.phoneNumber || null,
              private_address: formData.address || null,
              private_city: formData.city || null,
              private_postal_code: formData.postalCode || null,
              visibility_mode: formData.visibilityMode,
            }, { onConflict: 'id' });

          if (repairError) {
            setLoading(false);
            toast.error('Profil-Reparatur fehlgeschlagen. Bitte kontaktiere den Support.', {
              duration: 10000,
            });
            return;
          }

          toast.success('Konto wiederhergestellt! Willkommen zurück.');
          navigate('/feed');
          return;
        }

        // Profile exists, just log them in
        toast.success('Willkommen zurück!');
        navigate('/feed');
        return;
      }

      // Other signup errors
      if (error) {
        setLoading(false);
        toast.error(error.message || 'Registrierung fehlgeschlagen', {
          duration: 10000,
        });
        return; // Don't navigate on error
      }

      if (!data.user) {
        setLoading(false);
        toast.error('Registrierung fehlgeschlagen: Kein Benutzer erstellt', {
          duration: 10000,
        });
        return;
      }

      // Step 2: Create profile WITHOUT photos (photos will be uploaded on profile page)
      // This avoids RLS timing issues with storage policies
      console.log('Creating profile immediately...');
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          languages: selectedLanguages,
          gender: formData.gender || null,
          is_couple: formData.isCouple,
          partner_name: formData.isCouple ? formData.partnerName : null,
          partner_gender: formData.isCouple ? formData.partnerGender : null,
          partner_photo_url: null, // Will be uploaded on profile page
          avatar_url: null, // Will be uploaded on profile page
          phone_number: formData.phoneNumber || null,
          private_address: formData.address || null,
          private_city: formData.city || null,
          private_postal_code: formData.postalCode || null,
          visibility_mode: formData.visibilityMode,
        }, { onConflict: 'id' });

      if (profileError) {
        setLoading(false);
        console.error('Profile creation failed:', profileError);
        toast.error('Profil konnte nicht erstellt werden. Bitte kontaktiere den Support.', {
          duration: 10000,
        });
        return;
      }

      // Step 3: Send welcome email (don't block signup on failure)
      try {
        await supabase.functions.invoke('send-welcome-email', {
          body: {
            email: formData.email,
            firstName: formData.firstName,
            language: i18n.language || 'de',
          },
        });
        console.log('Welcome email sent successfully');
      } catch (emailError) {
        console.error('Welcome email failed (non-blocking):', emailError);
        // Don't block signup if email fails
      }

      // Set flag to trigger profile completion prompt
      localStorage.setItem('just_registered', 'true');
      localStorage.setItem('needs_photo_upload', 'true');
      
      toast.success(t('auth.account_created'));
      // Redirect to profile page to complete photo uploads
      navigate('/profile');
    } catch (error: any) {
      setLoading(false);
      console.error('Signup error:', error);
      toast.error(error.message || t('auth.account_creation_failed'), {
        duration: 10000,
      });
      // Don't navigate on error - let user read the message
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-4 left-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="gap-2"
        >
          {t('auth.back_to_home')}
        </Button>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <ChefHat className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">{t('auth.join_title')}</CardTitle>
          <CardDescription>{t('auth.join_desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            {/* 1. LANGUAGE SELECTION - First */}
            <div className="space-y-2">
              <Label>{t('auth.i_speak')}</Label>
              <p className="text-xs text-muted-foreground">{t('signup.select_languages')}</p>
              <div className="flex flex-wrap gap-2">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => toggleLanguage(lang.code)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedLanguages.includes(lang.code)
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
              <Alert className="mt-2">
                <Globe className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {t('signup.chat_translation_note')}
                </AlertDescription>
              </Alert>
              {/* Language Request - Input Field */}
              <div className="mt-3 space-y-2">
                <Label htmlFor="languageRequest" className="text-xs">
                  ➕ Fehlt deine Sprache? Hier anfragen
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="languageRequest"
                    type="text"
                    placeholder="z.B. Koreanisch, Hindi"
                    className="flex-1"
                    value={requestedLanguage}
                    onChange={(e) => setRequestedLanguage(e.target.value)}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      if (requestedLanguage.trim()) {
                        toast.success(`Sprachwunsch "${requestedLanguage}" notiert!`);
                        setRequestedLanguage('');
                      }
                    }}
                  >
                    Senden
                  </Button>
                </div>
              </div>
            </div>

            {/* 2. ACCOUNT TYPE - Single or Couple */}
            <div className="space-y-2 p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
              <Label className="text-sm font-semibold text-foreground">{t('signup.account_type')}</Label>
              <RadioGroup
                value={accountType}
                onValueChange={(value: 'single' | 'couple') => {
                  setAccountType(value);
                  setFormData({ ...formData, isCouple: value === 'couple' });
                }}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="single" id="account-single" />
                  <Label htmlFor="account-single" className="text-sm cursor-pointer">
                    {t('signup.single')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="couple" id="account-couple" />
                  <Label htmlFor="account-couple" className="text-sm cursor-pointer">
                    {t('signup.couple')}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* 3. YOUR PERSONAL DETAILS */}
            <div className="space-y-4 p-4 border rounded-lg">
              <p className="text-sm font-semibold text-foreground">👤 {t('signup.your_details') || 'Deine Angaben'}</p>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="firstName">Vorname <span className="text-destructive">*</span></Label>
                  <Input
                    id="firstName"
                    placeholder={t('auth.first_name_placeholder')}
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Nachname <span className="text-destructive">*</span></Label>
                  <Input
                    id="lastName"
                    placeholder={t('auth.last_name_placeholder')}
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="gender">{t('signup.gender')}</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })} required>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder={t('signup.genderPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="woman">{t('signup.genderWoman')}</SelectItem>
                    <SelectItem value="man">{t('signup.genderMan')}</SelectItem>
                    <SelectItem value="diverse">{t('signup.genderDiverse')}</SelectItem>
                    <SelectItem value="none">{t('signup.genderNone')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Visibility Mode - Security Settings */}
              <div className="space-y-3 border-l-4 border-primary pl-4 py-2 bg-muted/30 rounded-r">
                <Label className="text-sm font-semibold">{t('signup.visibilityMode')}</Label>
                <RadioGroup 
                  value={formData.visibilityMode} 
                  onValueChange={(value: 'all' | 'women_fli' | 'women_only') => {
                    setFormData({ ...formData, visibilityMode: value });
                    setSelfDeclarationChecked(false);
                  }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="visibility-all" />
                      <Label htmlFor="visibility-all" className="text-sm cursor-pointer">
                        {t('signup.visibilityAll')}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem 
                        value="women_fli" 
                        id="visibility-women-fli" 
                        disabled={formData.gender === 'man'}
                      />
                      <Label 
                        htmlFor="visibility-women-fli" 
                        className={`text-sm cursor-pointer ${formData.gender === 'man' ? 'opacity-50' : ''}`}
                      >
                        {t('signup.visibilityWomenFli')}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem 
                        value="women_only" 
                        id="visibility-women-only" 
                        disabled={formData.gender === 'man'}
                      />
                      <Label 
                        htmlFor="visibility-women-only" 
                        className={`text-sm cursor-pointer ${formData.gender === 'man' ? 'opacity-50' : ''}`}
                      >
                        {t('signup.visibilityWomenOnly')}
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
                
                {/* Self-Declaration Checkbox for Protected Modes */}
                {(formData.visibilityMode === 'women_fli' || formData.visibilityMode === 'women_only') && (
                  <div className="flex items-start space-x-2 mt-3 pt-3 border-t">
                    <Checkbox 
                      id="self-declaration" 
                      checked={selfDeclarationChecked}
                      onCheckedChange={(checked) => setSelfDeclarationChecked(checked as boolean)}
                    />
                    <Label 
                      htmlFor="self-declaration" 
                      className="text-xs leading-relaxed cursor-pointer"
                    >
                      {t('signup.selfDeclaration')}
                    </Label>
                  </div>
                )}
              </div>

              {/* Photo Upload Notice - Photos will be uploaded on profile page */}
              <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
                  📸 <strong>{t('signup.photo_after_registration')}</strong>
                </AlertDescription>
              </Alert>
            </div>

            {/* Partner Fields (Conditional) */}
            {accountType === 'couple' && (
              <div className="space-y-4 p-4 border-2 border-primary/30 rounded-lg bg-primary/5">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">👫</span>
                  <p className="text-base font-bold text-foreground">{t('signup.partner_details')}</p>
                </div>
                
                <div>
                  <Label htmlFor="partnerName">{t('signup.partner_name')}</Label>
                  <Input
                    id="partnerName"
                    value={formData.partnerName}
                    onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                    placeholder="Maria Müller"
                    required={accountType === 'couple'}
                  />
                </div>

                <div>
                  <Label htmlFor="partnerGender">{t('signup.partner_gender')}</Label>
                  <Select 
                    value={formData.partnerGender} 
                    onValueChange={(value) => setFormData({ ...formData, partnerGender: value })}
                  >
                    <SelectTrigger id="partnerGender">
                      <SelectValue placeholder={t('signup.select_gender')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="woman">{t('signup.genderWoman')}</SelectItem>
                      <SelectItem value="man">{t('signup.genderMan')}</SelectItem>
                      <SelectItem value="diverse">{t('signup.genderDiverse')}</SelectItem>
                      <SelectItem value="none">{t('signup.genderNone')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Partner photo notice - will be uploaded on profile page */}
                <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                  <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
                    📸 {t('signup.partner_photo_after_registration')}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">{t('signup.phoneNumber')}</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="+41 79 123 45 67"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Strasse und Hausnummer <span className="text-destructive">*</span></Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Hauptstrasse 123"
                required
              />
              <p className="text-xs text-muted-foreground">
                Wichtig für die Umkreissuche.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postalCode">{t('signup.postalCode')}</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  placeholder="4051"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">{t('signup.city')}</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Basel"
                />
              </div>
            </div>
            
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-xs text-foreground">{t('signup.addressHint')}</p>
            </div>

            <div>
              <Label htmlFor="email">E-Mail <span className="text-destructive">*</span></Label>
              <Input
                id="email"
                type="email"
                placeholder={t('auth.email_placeholder')}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Passwort <span className="text-destructive">*</span></Label>
              <Input
                id="password"
                type="password"
                placeholder={t('auth.password_placeholder')}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">Mindestens 6 Zeichen</p>
              {formData.password && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Passwort-Sicherheit:</span>
                    <span className={`font-medium ${
                      passwordStrength.level >= 80 ? 'text-green-600' :
                      passwordStrength.level >= 60 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${passwordStrength.level}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('auth.creating_account') : t('auth.create_account')}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              {t('auth.already_have_account')}{' '}
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto font-semibold text-primary"
                onClick={() => navigate('/login')}
              >
                {t('auth.sign_in_link')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
