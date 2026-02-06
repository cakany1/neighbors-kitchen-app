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
import { Mail, Send, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';

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
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const [isLoadingKey, setIsLoadingKey] = useState(true);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  // Fetch Turnstile site key from edge function
  useEffect(() => {
    const fetchSiteKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-turnstile-key');
        if (error) throw error;
        if (data?.siteKey) {
          setSiteKey(data.siteKey);
        } else {
          console.warn('Turnstile site key not configured');
        }
      } catch (err) {
        console.error('Failed to fetch Turnstile key:', err);
      } finally {
        setIsLoadingKey(false);
      }
    };
    fetchSiteKey();
  }, []);

  // Initialize Turnstile widget when site key is available
  useEffect(() => {
    if (!siteKey) {
      return;
    }

    const initTurnstile = () => {
      if (turnstileRef.current && window.turnstile && !widgetIdRef.current) {
        widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
          sitekey: siteKey,
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
  }, [siteKey, i18n.language]);

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
              {isLoadingKey ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : siteKey ? (
                <div 
                  ref={turnstileRef} 
                  className="flex justify-center"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{t('contact.captcha_not_configured')}</p>
              )}
              {captchaError && (
                <p className="text-sm text-destructive">{t('contact.captcha_error')}</p>
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
