import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ChefHat } from 'lucide-react';
import { toast } from 'sonner';
import { TwoFactorVerify } from '@/components/TwoFactorVerify';

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  // 2FA state
  const [show2FA, setShow2FA] = useState(false);

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
        return;
      }

      if (!data.user) {
        setLoading(false);
        toast.error('Anmeldung fehlgeschlagen', {
          duration: 10000,
        });
        return;
      }

      // Check if user has MFA enabled (AAL1 means password only, AAL2 means MFA verified)
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      
      if (aalData?.nextLevel === 'aal2' && aalData?.currentLevel === 'aal1') {
        // User has MFA enabled but hasn't verified yet - show 2FA screen
        setLoading(false);
        setShow2FA(true);
        return;
      }

      // Continue with normal login flow
      await completeLogin(data.user);
    } catch (error: any) {
      setLoading(false);
      console.error('Login error:', error);
      toast.error(error.message || t('auth.login_failed'), {
        duration: 10000,
      });
    }
  };

  const completeLogin = async (user: any) => {
    try {
      // PROFILE CHECK: Verify profile exists (self-healing for orphaned users)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      // REPAIR: If profile is missing, create emergency profile
      if (!existingProfile) {
        console.log('Orphan user detected after login! Creating emergency profile...');
        const { error: repairError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            first_name: user.user_metadata?.first_name || 'User',
            last_name: user.user_metadata?.last_name || '',
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
      console.error('Login completion error:', error);
      toast.error(error.message || t('auth.login_failed'), {
        duration: 10000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handle2FASuccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await completeLogin(user);
    }
  };

  const handle2FACancel = async () => {
    await supabase.auth.signOut();
    setShow2FA(false);
  };

  const handlePasswordReset = async () => {
    if (!resetEmail.trim()) {
      toast.error(t('auth.enter_email_for_reset'));
      return;
    }

    setResetLoading(true);
    try {
      // Use our custom edge function for reliable email delivery via Resend
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: {
          email: resetEmail,
          language: localStorage.getItem('i18nextLng') || 'de',
        },
      });

      if (error) {
        console.error('Password reset error:', error);
        toast.error(t('auth.reset_failed'));
      } else {
        toast.success(t('auth.reset_email_sent'));
        setResetDialogOpen(false);
        setResetEmail('');
      }
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(error.message || t('auth.reset_failed'));
    } finally {
      setResetLoading(false);
    }
  };

  // Show 2FA verification screen
  if (show2FA) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <TwoFactorVerify
          onSuccess={handle2FASuccess}
          onCancel={handle2FACancel}
        />
      </div>
    );
  }

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

            <div className="flex justify-end">
              <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-sm text-primary hover:underline"
                  >
                    {t('auth.forgot_password')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('auth.reset_password')}</DialogTitle>
                    <DialogDescription>
                      {t('auth.reset_password_desc')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <Label htmlFor="reset-email">{t('auth.email')}</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder={t('auth.email_placeholder')}
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                      />
                    </div>
                    <Button 
                      onClick={handlePasswordReset} 
                      className="w-full"
                      disabled={resetLoading}
                    >
                      {resetLoading ? t('common.loading') : t('auth.send_reset_link')}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
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
