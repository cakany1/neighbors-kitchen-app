import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChefHat, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';

const Signup = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
  });

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

      // Other signup errors
      if (error) {
        setLoading(false);
        toast.error(error.message || t('auth.account_creation_failed'), {
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

      // Step 2: Create minimal profile
      console.log('Creating minimal profile...');
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          first_name: formData.firstName,
          last_name: '', // Will be completed later
          languages: [i18n.language || 'de'],
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
