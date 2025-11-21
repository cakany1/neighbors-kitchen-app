import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChefHat } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        setLoading(false);
        toast.error(error.message || t('auth.login_failed'), {
          duration: 10000,
        });
        return; // Don't navigate on error
      }

      if (!data.user) {
        setLoading(false);
        toast.error('Anmeldung fehlgeschlagen', {
          duration: 10000,
        });
        return;
      }

      // PROFILE CHECK: Verify profile exists (self-healing for orphaned users)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle();

      // REPAIR: If profile is missing, create emergency profile
      if (!existingProfile) {
        console.log('Orphan user detected after login! Creating emergency profile...');
        const { error: repairError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            first_name: data.user.user_metadata?.first_name || 'User',
            last_name: data.user.user_metadata?.last_name || '',
            languages: ['de'],
          });

        if (repairError) {
          setLoading(false);
          console.error('Profile repair failed:', repairError);
          toast.error('Profil-Reparatur fehlgeschlagen. Bitte kontaktiere den Support.', {
            duration: 10000,
          });
          return;
        }

        toast.success('Profil wiederhergestellt! Willkommen zurück.');
      } else {
        toast.success(t('auth.welcome_toast'));
      }

      navigate('/feed');
    } catch (error: any) {
      setLoading(false);
      console.error('Login error:', error);
      toast.error(error.message || t('auth.login_failed'), {
        duration: 10000,
      });
      // Don't navigate on error
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
          <CardTitle className="text-2xl">{t('auth.welcome_back')}</CardTitle>
          <CardDescription>{t('auth.sign_in_desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
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
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('auth.signing_in') : t('auth.sign_in')}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              {t('auth.no_account')}{' '}
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto font-semibold text-primary"
                onClick={() => navigate('/signup')}
              >
                {t('auth.sign_up')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
