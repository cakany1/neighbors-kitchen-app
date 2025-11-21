import { useState } from 'react';
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
    language: 'en',
    gender: '',
    isCouple: false,
    phoneNumber: '',
    address: '',
    city: '',
    postalCode: '',
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
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

      if (error) throw error;

      // Update profile with additional fields after signup
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            phone_number: formData.phoneNumber || null,
            private_address: formData.address || null,
            private_city: formData.city || null,
            private_postal_code: formData.postalCode || null,
          })
          .eq('id', data.user.id);

        if (profileError) {
          console.error('Profile update error:', profileError);
        }
      }

      toast.success(t('auth.account_created'));
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || t('auth.account_creation_failed'));
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

            <div>
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
