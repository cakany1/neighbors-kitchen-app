import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ChefHat } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';

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
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    language: 'de',
    gender: '',
    isCouple: false,
    partnerName: '',
    partnerGender: '',
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
            language: formData.language,
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
              languages: [formData.language],
              gender: formData.gender || null,
              is_couple: formData.isCouple,
              partner_name: formData.isCouple ? formData.partnerName : null,
              partner_gender: formData.isCouple ? formData.partnerGender : null,
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

      // Step 2: Wait a moment for trigger to fire
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Check if profile was created by trigger
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle();

      // Step 4: If no profile exists, create it manually with upsert
      if (!existingProfile) {
        console.log('Profile not auto-created, inserting manually...');
        const { error: insertError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            first_name: formData.firstName,
            last_name: formData.lastName,
            languages: [formData.language],
            gender: formData.gender || null,
            is_couple: formData.isCouple,
            partner_name: formData.isCouple ? formData.partnerName : null,
            partner_gender: formData.isCouple ? formData.partnerGender : null,
            phone_number: formData.phoneNumber || null,
            private_address: formData.address || null,
            private_city: formData.city || null,
            private_postal_code: formData.postalCode || null,
          }, { onConflict: 'id' });

        if (insertError) {
          setLoading(false);
          console.error('Manual profile creation failed:', insertError);
          toast.error('Profil konnte nicht erstellt werden. Bitte kontaktiere den Support.', {
            duration: 10000,
          });
          return; // Don't navigate on error
        }
      } else {
        // Step 5: Update existing profile with additional fields
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            phone_number: formData.phoneNumber || null,
            private_address: formData.address || null,
            private_city: formData.city || null,
            private_postal_code: formData.postalCode || null,
          })
          .eq('id', data.user.id);

        if (updateError) {
          console.error('Profile update error:', updateError);
        }
      }

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

            <div>
              <Label htmlFor="language">{t('auth.i_speak')}</Label>
              <Select value={formData.language} onValueChange={(value) => setFormData({ ...formData, language: value })}>
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isCouple"
                checked={formData.isCouple}
                onCheckedChange={(checked) => setFormData({ ...formData, isCouple: checked as boolean })}
              />
              <Label htmlFor="isCouple" className="text-sm font-normal cursor-pointer">
                {t('signup.isCouple')}
              </Label>
            </div>

            {/* Partner Fields (Conditional) */}
            {formData.isCouple && (
              <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
                <p className="text-sm font-semibold text-foreground">Partner-Angaben</p>
                
                <div>
                  <Label htmlFor="partnerName">Partner Name</Label>
                  <Input
                    id="partnerName"
                    value={formData.partnerName}
                    onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                    placeholder="Maria Müller"
                    required={formData.isCouple}
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
              <p className="text-xs text-muted-foreground">{t('signup.phoneHint')}</p>
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
