import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ChefHat, Loader2, Info, Users, User } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const Signup = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    isCouple: false,
  });

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/feed`,
        },
      });

      if (error) {
        toast.error(error.message || t('auth.account_creation_failed'));
        setGoogleLoading(false);
      }
    } catch (error: any) {
      console.error('Google signup error:', error);
      toast.error(error.message || t('auth.account_creation_failed'));
      setGoogleLoading(false);
    }
  };

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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName.trim()) {
      toast.error(t('signup.first_name_required'));
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error(t('signup.password_too_short'));
      return;
    }
    
    setLoading(true);

    try {
      // Step 1: Create Auth User with minimal data
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: formData.firstName,
            languages: [i18n.language || 'de'],
          },
        },
      });

      // AUTO-RECOVERY: If user already exists, try to log them in
      if (error && (error.message.includes('already registered') || error.message.includes('User already registered'))) {
        console.log('User already exists, attempting login...');
        
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (loginError) {
          setLoading(false);
          toast.error(t('signup.account_exists_wrong_password'), {
            duration: 10000,
          });
          return;
        }

        if (loginData.user) {
          toast.success(t('auth.welcome_toast'));
          navigate('/feed');
          return;
        }
      }

      // Other signup errors - translate common Supabase messages
      if (error) {
        setLoading(false);
        let errorMessage = t('auth.account_creation_failed');
        
        if (error.message.includes('weak') || error.message.includes('easy to guess')) {
          errorMessage = t('auth.weak_password');
        } else if (error.message.includes('already registered') || error.message.includes('already been registered')) {
          errorMessage = t('auth.email_taken');
        } else if (error.message.includes('Invalid email')) {
          errorMessage = t('auth.invalid_email');
        }
        
        toast.error(errorMessage, {
          duration: 10000,
        });
        return;
      }

      if (!data.user) {
        setLoading(false);
        toast.error(t('auth.account_creation_failed'), {
          duration: 10000,
        });
        return;
      }

      // Step 2: Create minimal profile with couple info
      console.log('Creating minimal profile...');
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          first_name: formData.firstName,
          last_name: '', // Will be completed later
          languages: [i18n.language || 'de'],
          is_couple: formData.isCouple,
        }, { onConflict: 'id' });

      if (profileError) {
        setLoading(false);
        console.error('Profile creation failed:', profileError);
        toast.error(t('signup.profile_creation_failed'), {
          duration: 10000,
        });
        return;
      }

      // Step 3: Send welcome email (non-blocking)
      try {
        await supabase.functions.invoke('send-welcome-email', {
          body: {
            email: formData.email,
            firstName: formData.firstName,
            language: i18n.language || 'de',
          },
        });
      } catch (emailError) {
        console.error('Welcome email failed (non-blocking):', emailError);
      }

      toast.success(t('auth.account_created'));
      // Redirect directly to feed - user can browse immediately
      navigate('/feed');
    } catch (error: any) {
      setLoading(false);
      console.error('Signup error:', error);
      toast.error(error.message || t('auth.account_creation_failed'), {
        duration: 10000,
      });
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
          {/* Google One-Click Signup */}
          <Button
            type="button"
            variant="outline"
            className="w-full mb-4 gap-2"
            onClick={handleGoogleSignup}
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
            {t('auth.google_signup')}
          </Button>

          <div className="relative mb-4">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
              {t('auth.or_email')}
            </span>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            {/* First Name */}
            <div>
              <Label htmlFor="firstName">
                {t('auth.first_name')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstName"
                placeholder={t('auth.first_name_placeholder')}
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>

            {/* Account Type Selection */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label>{t('signup.account_type')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full">
                      <Info className="h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 text-sm">
                    <h4 className="font-semibold mb-2">{t('signup.account_type_help_title')}</h4>
                    <p className="mb-2"><strong>{t('signup.single')}:</strong> {t('signup.account_type_single_desc')}</p>
                    <p><strong>{t('signup.couple')}:</strong> {t('signup.account_type_couple_desc')}</p>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={!formData.isCouple ? 'default' : 'outline'}
                  className="w-full gap-2"
                  onClick={() => setFormData({ ...formData, isCouple: false })}
                >
                  <User className="w-4 h-4" />
                  {t('signup.single')}
                </Button>
                <Button
                  type="button"
                  variant={formData.isCouple ? 'default' : 'outline'}
                  className="w-full gap-2"
                  onClick={() => setFormData({ ...formData, isCouple: true })}
                >
                  <Users className="w-4 h-4" />
                  {t('signup.couple')}
                </Button>
              </div>
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">
                {t('auth.email')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={t('auth.email_placeholder')}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password">
                {t('auth.password')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={t('auth.password_placeholder')}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              {formData.password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <Progress value={passwordStrength.level} className="h-1" />
                  <p className={`text-xs ${
                    passwordStrength.level >= 65 ? 'text-green-600' : 
                    passwordStrength.level >= 40 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
              {passwordStrength.label}
                  </p>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {t('signup.password_hint')}
              </p>
              <div className="mt-2 p-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg">
                <p className="text-xs font-medium text-orange-700 dark:text-orange-400">
                  ⚠️ {t('signup.leaked_password_title')}
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  {t('signup.leaked_password_hint')}
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('auth.creating_account')}
                </>
              ) : (
                t('auth.create_account')
              )}
            </Button>

            {/* Already have account */}
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

            {/* Info about profile completion */}
            <p className="text-xs text-center text-muted-foreground">
              {t('signup.complete_profile_later')}
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
