import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { mockMeals } from '@/data/mockMeals';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Star, Heart, Loader2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const Payment = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const meal = mockMeals.find(m => m.id === id);
  const [paymentAmount, setPaymentAmount] = useState(
    Math.max(meal?.pricing.suggested || 7, meal?.pricing.minimum || 7, 7)
  );
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if this is a demo meal
  const isDemoMeal = id?.startsWith('demo-');

  if (!meal) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">{t('payment.meal_not_found')}</p>
          <Button onClick={() => navigate('/app')} className="mt-4">
            {t('payment.back_to_feed')}
          </Button>
        </div>
      </div>
    );
  }

  const serviceFee = 2.00;
  const totalAmount = paymentAmount + serviceFee;
  const minTotal = 7.00;
  const minPayment = 5; // CHF 5 + CHF 2 fee = CHF 7 minimum
  const maxPayment = Math.max((meal.pricing.suggested || 20) * 2, 50);

  const handlePayment = async () => {
    // Validate minimum total amount
    if (totalAmount < minTotal) {
      toast.error(`Minimumbetrag ist CHF ${minTotal.toFixed(2)} (inkl. Gebühr).`);
      return;
    }

    // Demo mode - just show success message
    if (isDemoMeal) {
      toast.success(t('meal.demo_meal_notice'));
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Call edge function to create Stripe Checkout session
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: Math.round(paymentAmount * 100), // Convert to cents
          mealId: id,
          mealTitle: meal.title,
          chefName: `${meal.chef.firstName} ${meal.chef.lastName.charAt(0)}.`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(t('payment.error', 'Zahlung fehlgeschlagen. Bitte versuche es erneut.'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Pay What You Want</h1>
          <p className="text-muted-foreground">Support {meal.chef.firstName} for their delicious {meal.title}</p>
        </div>

        <div className="space-y-6">
          {/* Chef Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                  👨‍🍳
                </div>
                <div>
                  <p className="font-semibold text-lg text-foreground">
                    {meal.chef.firstName} {meal.chef.lastName.charAt(0)}.
                  </p>
                  <div className="flex items-center gap-1 text-trust-gold">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-medium">{meal.chef.karma} Karma</span>
                  </div>
                </div>
              </div>
              <Badge variant="secondary" className="w-full justify-center py-2">
                {meal.title}
              </Badge>
            </CardContent>
          </Card>

          {/* Payment Amount Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Choose Your Amount</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-primary mb-2">
                  CHF {paymentAmount}
                </div>
                <p className="text-sm text-muted-foreground">
                  Minimum: CHF {meal.pricing.minimum}
                  {meal.pricing.suggested && ` • Suggested: CHF ${meal.pricing.suggested}`}
                </p>
              </div>
              
              {/* Payment Breakdown */}
              <div className="bg-secondary-light p-4 rounded-lg space-y-2 border border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Beitrag an Koch:</span>
                  <span className="font-medium">CHF {paymentAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Servicegebühr:</span>
                  <span className="font-medium">CHF {serviceFee.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-border flex justify-between">
                  <span className="font-bold">Total:</span>
                  <span className="font-bold text-lg text-primary">CHF {totalAmount.toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 italic">
                  💡 Inkl. CHF 2.00 Servicegebühr für den Plattform-Betrieb.
                </p>
                {totalAmount < minTotal && (
                  <p className="text-xs text-destructive mt-2">
                    ⚠️ Minimum total is CHF {minTotal.toFixed(2)}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <Slider
                  value={[paymentAmount]}
                  onValueChange={(value) => setPaymentAmount(Math.max(value[0], minPayment))}
                  min={minPayment}
                  max={maxPayment}
                  step={1}
                  className="w-full"
                />
                
                <div className="grid grid-cols-4 gap-2">
                  {[
                    Math.max(minPayment, meal.pricing.minimum),
                    Math.max(minPayment, meal.pricing.suggested || 10),
                    Math.max(minPayment, (meal.pricing.suggested || 10) + 5),
                    Math.max(minPayment, (meal.pricing.suggested || 10) + 10),
                  ].map((amount) => (
                    <Button
                      key={amount}
                      variant={paymentAmount === amount ? 'default' : 'outline'}
                      onClick={() => setPaymentAmount(amount)}
                      className="w-full"
                    >
                      {amount}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="bg-secondary-light p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <Heart className="w-5 h-5 text-secondary mt-0.5" />
                  <div className="text-sm text-foreground">
                    <p className="font-medium mb-1">Why pay fairly?</p>
                    <p className="text-muted-foreground">
                      Your fair payment helps build trust in the community and supports neighbors 
                      who share their time and cooking skills with you.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Action */}
          <Card>
            <CardHeader>
              <CardTitle>{t('payment.method', 'Zahlungsmethode')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isDemoMeal && (
                <div className="bg-muted/50 p-3 rounded-lg text-center text-sm text-muted-foreground">
                  ℹ️ {t('meal.demo_meal_hint')}
                </div>
              )}
              
              <Button 
                onClick={handlePayment}
                disabled={totalAmount < minTotal || isProcessing}
                size="lg"
                className="w-full h-14 text-lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {t('payment.processing', 'Wird verarbeitet...')}
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    {isDemoMeal 
                      ? t('payment.demo_button', 'Demo-Zahlung testen')
                      : `${t('payment.pay_now', 'Jetzt bezahlen')} - CHF ${totalAmount.toFixed(2)}`
                    }
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                {isDemoMeal 
                  ? t('payment.demo_notice', 'Dies ist eine Demo. Keine echte Zahlung.')
                  : t('payment.secure_notice', '🔒 Sichere Zahlung via Stripe')}
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Payment;
