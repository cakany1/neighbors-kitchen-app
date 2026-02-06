import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Send, ArrowLeft, ShieldCheck } from 'lucide-react';

// Turnstile site key from environment
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';

// Declare Turnstile types
declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: {
        sitekey: string;
        callback: (token: string) => void;
        'expired-callback'?: () => void;
        'error-callback'?: () => void;
        theme?: 'light' | 'dark' | 'auto';
        language?: string;
      }) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export default function Contact() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    website: '', // Honeypot field
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState(false);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  // Initialize Turnstile widget
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) {
      console.warn('Turnstile site key not configured');
      return;
    }

    const initTurnstile = () => {
      if (turnstileRef.current && window.turnstile && !widgetIdRef.current) {
        widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token: string) => {
            setCaptchaToken(token);
            setCaptchaError(false);
          },
          'expired-callback': () => {
            setCaptchaToken(null);
          },
          'error-callback': () => {
            setCaptchaToken(null);
            setCaptchaError(true);
          },
          theme: 'auto',
          language: i18n.language === 'de' ? 'de' : 'en',
        });
      }
    };

    // Wait for Turnstile script to load
    if (window.turnstile) {
      initTurnstile();
    } else {
      const checkInterval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(checkInterval);
          initTurnstile();
        }
      }, 100);

      // Cleanup interval after 10 seconds
      setTimeout(() => clearInterval(checkInterval), 10000);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [i18n.language]);

  const resetCaptcha = useCallback(() => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      setCaptchaToken(null);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: t('contact.error_title'),
        description: t('contact.error_fill_all'),
        variant: "destructive",
      });
      return;
    }

    // Check CAPTCHA token
    if (!captchaToken) {
      toast({
        title: t('contact.error_title'),
        description: t('contact.captcha_required'),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('submit-contact', {
        body: {
          name: formData.name,
          email: formData.email,
          message: formData.message,
          website: formData.website, // Honeypot
          captchaToken: captchaToken,
        },
      });

      if (error) throw error;

      // Handle rate limiting or CAPTCHA errors
      if (data?.error) {
        const errorMessage = i18n.language === 'de' && data.error_de 
          ? data.error_de 
          : data.error;
        throw new Error(errorMessage);
      }

      toast({
        title: t('contact.success_title'),
        description: t('contact.success_desc'),
      });

      // Reset form and CAPTCHA
      setFormData({ name: '', email: '', message: '', website: '' });
      resetCaptcha();
    } catch (error: any) {
      console.error('Error submitting contact form:', error);
      toast({
        title: t('contact.error_title'),
        description: error.message || t('contact.error_send_failed'),
        variant: "destructive",
      });
      // Reset CAPTCHA on error for retry
      resetCaptcha();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCaptchaReady = !!captchaToken;
  const isFormValid = formData.name && formData.email && formData.message && isCaptchaReady;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-2xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('contact.back_to_home')}
        </Button>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <Mail className="w-12 h-12 mx-auto text-primary" />
            <h1 className="text-3xl font-bold text-foreground">{t('contact.title')}</h1>
            <p className="text-muted-foreground">
              {t('contact.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 bg-card border border-border rounded-lg p-6">
            <div className="space-y-2">
              <Label htmlFor="name">{t('contact.name')}</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('contact.name_placeholder')}
                maxLength={100}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('contact.email')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={t('contact.email_placeholder')}
                maxLength={255}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">{t('contact.message')}</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder={t('contact.message_placeholder')}
                rows={6}
                maxLength={5000}
                required
              />
            </div>

            {/* Honeypot field - hidden from users, bots will fill it */}
            <div className="absolute -left-[9999px]" aria-hidden="true">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="text"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {/* Turnstile CAPTCHA Widget */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                {t('contact.captcha_label')}
              </Label>
              <div 
                ref={turnstileRef} 
                className="flex justify-center"
              />
              {captchaError && (
                <p className="text-sm text-destructive">{t('contact.captcha_error')}</p>
              )}
              {!TURNSTILE_SITE_KEY && (
                <p className="text-sm text-muted-foreground">{t('contact.captcha_not_configured')}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !isFormValid}
            >
              {isSubmitting ? (
                t('contact.submitting')
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {t('contact.submit')}
                </>
              )}
            </Button>

            {!isCaptchaReady && formData.name && formData.email && formData.message && (
              <p className="text-sm text-muted-foreground text-center">
                {t('contact.captcha_hint')}
              </p>
            )}
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
