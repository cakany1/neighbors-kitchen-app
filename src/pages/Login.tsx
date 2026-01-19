import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ChefHat, Loader2 } from 'lucide-react';
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
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/feed`,
        },
      });

      if (error) {
        toast.error(error.message || t('auth.login_failed'));
        setGoogleLoading(false);
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      toast.error(error.message || t('auth.login_failed'));
      setGoogleLoading(false);
    }
  };

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
          {/* Google One-Click Login */}
          <Button
            type="button"
            variant="outline"
            className="w-full mb-4 gap-2"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {t('auth.google_login')}
          </Button>

          <div className="relative mb-4">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
              {t('auth.or_email')}
            </span>
          </div>

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
