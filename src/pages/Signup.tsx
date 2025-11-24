import { useState, useMemo } from 'react';
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
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [accountType, setAccountType] = useState<'single' | 'couple'>('single');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['de']);
  const [partnerPhotoFile, setPartnerPhotoFile] = useState<File | null>(null);
  const [partnerPhotoPreview, setPartnerPhotoPreview] = useState<string>('');
  const [uploadingPartnerPhoto, setUploadingPartnerPhoto] = useState(false);
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
    phoneNumber: '',
    address: '',
    city: '',
    postalCode: '',
  });

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    const pwd = formData.password;
    if (pwd.length === 0) return { level: 0, label: '', color: '' };
    
    if (pwd.length < 6) {
      return { level: 25, label: 'Zu kurz', color: 'bg-red-500' };
    }
    
    const hasNumber = /\d/.test(pwd);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
    
    if (pwd.length >= 10 && hasNumber && hasSpecialChar) {
      return { level: 100, label: 'Sicher', color: 'bg-green-500' };
    }
    
    if (pwd.length >= 8 && hasNumber) {
      return { level: 65, label: 'Mittel', color: 'bg-yellow-500' };
    }
    
    return { level: 40, label: 'Schwach', color: 'bg-orange-500' };
  }, [formData.password]);

  const handlePartnerPhotoUpload = async (file: File) => {
    setUploadingPartnerPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `partner_photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(filePath);

      setFormData({ ...formData, partnerPhotoUrl: publicUrl });
      setPartnerPhotoPreview(URL.createObjectURL(file));
      toast.success('Partner Foto hochgeladen');
    } catch (error: any) {
      toast.error('Foto-Upload fehlgeschlagen: ' + error.message);
    } finally {
      setUploadingPartnerPhoto(false);
    }
  };

  const handlePartnerPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Datei zu groß! Max 5MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Nur Bilder erlaubt!');
      return;
    }

    setPartnerPhotoFile(file);
    handlePartnerPhotoUpload(file);
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

      // Step 2: IMMEDIATELY create profile with upsert (no trigger dependency)
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
          partner_photo_url: formData.isCouple ? formData.partnerPhotoUrl : null,
          phone_number: formData.phoneNumber || null,
          private_address: formData.address || null,
          private_city: formData.city || null,
          private_postal_code: formData.postalCode || null,
        }, { onConflict: 'id' });

      if (profileError) {
        setLoading(false);
        console.error('Profile creation failed:', profileError);
        toast.error('Profil konnte nicht erstellt werden. Bitte kontaktiere den Support.', {
          duration: 10000,
        });
        return;
      }

      // Set flag to trigger onboarding tour
      localStorage.setItem('just_registered', 'true');
      
      toast.success(t('auth.account_created'));
      navigate('/feed');
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName">{t('auth.first_name')}</Label>
                <Input
                  id="firstName"
                  placeholder={t('auth.first_name_placeholder')}
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">{t('auth.last_name')}</Label>
                <Input
                  id="lastName"
                  placeholder={t('auth.last_name_placeholder')}
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('auth.i_speak')}</Label>
              <p className="text-xs text-muted-foreground">Wähle alle Sprachen, die du sprichst</p>
              <div className="grid grid-cols-2 gap-2">
                {languages.slice(0, 6).map((lang) => (
                  <div key={lang.code} className="flex items-center space-x-2">
                    <Checkbox
                      id={`lang-${lang.code}`}
                      checked={selectedLanguages.includes(lang.code)}
                      onCheckedChange={() => toggleLanguage(lang.code)}
                    />
                    <Label htmlFor={`lang-${lang.code}`} className="cursor-pointer text-sm">
                      {lang.name}
                    </Label>
                  </div>
                ))}
              </div>
              <Alert className="mt-2">
                <Globe className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  🇩🇪 Damit übersetzen wir den Chat automatisch für dich. Die App-Sprache bleibt davon unberührt.<br/>
                  🇬🇧 This enables automatic chat translation. It does not change the app interface language.
                </AlertDescription>
              </Alert>
            </div>

            <div>
              <Label htmlFor="gender">{t('signup.gender')}</Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })} required>
                <SelectTrigger id="gender">
                  <SelectValue placeholder={t('signup.genderPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{t('signup.genderMale')}</SelectItem>
                  <SelectItem value="female">{t('signup.genderFemale')}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">{t('signup.genderHint')}</p>
            </div>

            {/* Mandatory Avatar Upload */}
            <div className="space-y-2">
              <Label htmlFor="avatarPhoto" className="text-base font-semibold text-foreground">
                📸 Dein Profilfoto (Pflicht) *
              </Label>
              <Alert className="bg-destructive/10 border-destructive/30">
                <AlertDescription className="text-xs text-foreground">
                  ⚠️ Ohne Foto kannst du nicht bestellen oder anbieten.
                </AlertDescription>
              </Alert>
              <Input
                id="avatarPhoto"
                type="file"
                accept="image/*"
                required
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">Max 5MB, JPG/PNG</p>
              <Alert className="bg-yellow-500/10 border-yellow-500/30 mt-2">
                <AlertDescription className="text-xs text-foreground">
                  Hinweis: Dein Profilbild muss manuell verifiziert werden. Dies kann etwas Zeit in Anspruch nehmen, bevor du Mahlzeiten anbieten kannst.
                </AlertDescription>
              </Alert>
            </div>

            {/* Account Type Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Account Typ</Label>
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
                    Single
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="couple" id="account-couple" />
                  <Label htmlFor="account-couple" className="text-sm cursor-pointer">
                    Paar / Couple
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Partner Fields (Conditional) */}
            {accountType === 'couple' && (
              <div className="space-y-4 p-4 border-2 border-primary/30 rounded-lg bg-primary/5">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">👫</span>
                  <p className="text-base font-bold text-foreground">Partner-Angaben</p>
                </div>
                
                <div>
                  <Label htmlFor="partnerName">Partner Name</Label>
                  <Input
                    id="partnerName"
                    value={formData.partnerName}
                    onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                    placeholder="Maria Müller"
                    required={accountType === 'couple'}
                  />
                </div>

                <div>
                  <Label htmlFor="partnerGender">Partner Geschlecht</Label>
                  <Select 
                    value={formData.partnerGender} 
                    onValueChange={(value) => setFormData({ ...formData, partnerGender: value })}
                  >
                    <SelectTrigger id="partnerGender">
                      <SelectValue placeholder="Auswählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Männlich</SelectItem>
                      <SelectItem value="female">Weiblich</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="partnerPhoto" className="text-base font-semibold">
                    📸 Foto deines Partners (Optional)
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Hilft Nachbarn zu wissen, wer an der Tür stehen könnte
                  </p>
                  <input
                    id="partnerPhoto"
                    type="file"
                    accept="image/*"
                    onChange={handlePartnerPhotoSelect}
                    className="hidden"
                  />
                  {partnerPhotoPreview ? (
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-primary">
                      <img src={partnerPhotoPreview} alt="Partner" className="w-full h-full object-cover" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => {
                          setPartnerPhotoPreview('');
                          setPartnerPhotoFile(null);
                          setFormData({ ...formData, partnerPhotoUrl: '' });
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('partnerPhoto')?.click()}
                      disabled={uploadingPartnerPhoto}
                      className="w-full border-primary/30 hover:bg-primary/10"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {uploadingPartnerPhoto ? 'Lädt hoch...' : 'Partner-Foto hochladen'}
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">Max 5MB, JPG/PNG</p>
                </div>
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
              />
              <p className="text-xs text-muted-foreground">
                Ihre Telefonnummer dient ausschliesslich zur direkten Koordination bei der Abholung (z.B. "Bin in 5 Minuten da").
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">{t('signup.address')}</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Hauptstrasse 123"
              />
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
              <Label htmlFor="email">{t('auth.email')}</Label>
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
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t('auth.password_placeholder')}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
              />
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
