import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, LogOut, RefreshCw, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const VerifyEmail = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [checkingVerification, setCheckingVerification] = useState(false);

  useEffect(() => {
    // Get current user's email
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      
      // If already verified, redirect to feed
      if (user.email_confirmed_at) {
        navigate('/feed');
        return;
      }
      
      setUserEmail(user.email || null);
    };
    
    getUser();
  }, [navigate]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    
    setResending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.error(t('verify_email.no_email'));
        return;
      }

      // Get first name from profile for personalized email
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('id', user.id)
        .single();

      const { error } = await supabase.functions.invoke('send-welcome-email', {
        body: {
          email: user.email,
          firstName: profile?.first_name || 'User',
          language: i18n.language || 'de',
        },
      });

      if (error) {
        throw error;
      }

      toast.success(t('verify_email.resend_success'));
      setResendCooldown(60); // 60 second cooldown
    } catch (error: any) {
      console.error('Resend verification error:', error);
      toast.error(t('verify_email.resend_failed'));
    } finally {
      setResending(false);
    }
  };

  const handleCheckVerification = async () => {
    setCheckingVerification(true);
    try {
      // Refresh the session to get updated user data
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        throw error;
      }

      if (user?.email_confirmed_at) {
        toast.success(t('verify_email.verified_success'));
        navigate('/feed');
      } else {
        toast.info(t('verify_email.not_yet_verified'));
      }
    } catch (error: any) {
      console.error('Check verification error:', error);
      toast.error(t('verify_email.check_failed'));
    } finally {
      setCheckingVerification(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="w-10 h-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">{t('verify_email.title')}</CardTitle>
          <CardDescription className="text-base mt-2">
            {t('verify_email.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email display */}
          {userEmail && (
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">{t('verify_email.sent_to')}</p>
              <p className="font-medium text-foreground">{userEmail}</p>
            </div>
          )}

          {/* Check verification status button */}
          <Button
            onClick={handleCheckVerification}
            className="w-full gap-2"
            disabled={checkingVerification}
          >
            {checkingVerification ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            {t('verify_email.check_status')}
          </Button>

          {/* Resend verification email */}
          <Button
            variant="outline"
            onClick={handleResendVerification}
            className="w-full gap-2"
            disabled={resending || resendCooldown > 0}
          >
            {resending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {resendCooldown > 0 
              ? t('verify_email.resend_cooldown', { seconds: resendCooldown })
              : t('verify_email.resend_button')
            }
          </Button>

          {/* Spam hint */}
          <p className="text-xs text-center text-muted-foreground">
            {t('verify_email.spam_hint')}
          </p>

          {/* Logout button */}
          <div className="pt-4 border-t">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full gap-2 text-muted-foreground"
            >
              <LogOut className="w-4 h-4" />
              {t('verify_email.logout')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;
