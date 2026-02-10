import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Home, Heart, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

const PaymentSuccess = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [verifying, setVerifying] = useState(!!sessionId);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [stripeMode, setStripeMode] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setVerifying(false);
      return;
    }

    const verify = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('verify-payment', {
          body: { sessionId },
        });

        if (error) {
          console.error('Payment verification error:', error);
          setVerified(false);
        } else {
          setVerified(data?.verified === true);
          setStripeMode(data?.stripeMode || null);
        }
      } catch (err) {
        console.error('Payment verification failed:', err);
        setVerified(false);
      } finally {
        setVerifying(false);
      }
    };

    verify();
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="max-w-lg mx-auto px-4 py-12">
        <Card className="text-center">
          <CardContent className="pt-8 pb-8 space-y-6">
            {verifying ? (
              <>
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <Loader2 className="w-12 h-12 text-muted-foreground animate-spin" />
                </div>
                <p className="text-muted-foreground">
                  {t('payment.verifying', 'Zahlung wird überprüft...')}
                </p>
              </>
            ) : verified === false ? (
              <>
                <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-12 h-12 text-destructive" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-2">
                    {t('payment.verification_failed_title', 'Zahlung nicht bestätigt')}
                  </h1>
                  <p className="text-muted-foreground">
                    {t('payment.verification_failed_message', 'Die Zahlung konnte nicht verifiziert werden. Bitte kontaktiere uns bei Fragen.')}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-12 h-12 text-primary" />
                </div>
                
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-2">
                    {t('payment.success_title', 'Zahlung erfolgreich!')}
                  </h1>
                  <p className="text-muted-foreground">
                    {t('payment.success_message', 'Vielen Dank für deinen Beitrag. Du unterstützt damit deine Nachbarschaft!')}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 text-primary">
                  <Heart className="w-5 h-5 fill-current" />
                  <span className="font-medium">+5 Karma</span>
                </div>

                {stripeMode === 'test' && (
                  <Badge variant="secondary" className="mx-auto">
                    🟡 TEST-Modus – Keine echte Transaktion
                  </Badge>
                )}
              </>
            )}

            <div className="pt-4 space-y-3">
              <Button 
                onClick={() => navigate('/app')} 
                className="w-full"
                size="lg"
              >
                <Home className="w-4 h-4 mr-2" />
                {t('payment.back_to_feed', 'Zurück zum Feed')}
              </Button>
              
              <p className="text-xs text-muted-foreground">
                {t('payment.receipt_info', 'Eine Bestätigung wurde an deine E-Mail gesendet.')}
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
};

export default PaymentSuccess;
