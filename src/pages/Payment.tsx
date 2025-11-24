import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockMeals } from '@/data/mockMeals';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Star, Heart } from 'lucide-react';
import { toast } from 'sonner';

const Payment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const meal = mockMeals.find(m => m.id === id);
  const [paymentAmount, setPaymentAmount] = useState(
    Math.max(meal?.pricing.suggested || 7, meal?.pricing.minimum || 7, 7)
  );

  if (!meal) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Meal not found</p>
          <Button onClick={() => navigate('/app')} className="mt-4">
            Zurück zum Feed
          </Button>
        </div>
      </div>
    );
  }

  const handlePayment = () => {
    // Validate minimum total amount
    if (totalAmount < minTotal) {
      toast.error(`Minimumbetrag ist CHF ${minTotal.toFixed(2)} (inkl. Gebühr).`);
      return;
    }
    
    toast.success(`Payment of CHF ${paymentAmount} processed! Thank you for supporting ${meal.chef.firstName}.`);
    setTimeout(() => {
      navigate('/app');
    }, 1500);
  };

  const maxPayment = Math.max((meal.pricing.suggested || 20) * 2, 50);
  const serviceFee = 2.00;
  const totalAmount = paymentAmount + serviceFee;
  const minTotal = 7.00;
  const minPayment = 7;

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

          {/* Payment Method - Online Only */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full h-16 text-lg border-primary/50 hover:bg-primary/10"
                onClick={handlePayment}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                    💳
                  </div>
                  <span>Online Payment (Card / Stripe)</span>
                </div>
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                ℹ️ Only online payments accepted to ensure platform fees and security
              </p>
            </CardContent>
          </Card>

          <Button 
            onClick={handlePayment}
            size="lg"
            className="w-full h-14 text-lg"
            disabled={totalAmount < minTotal}
          >
            Complete Payment - CHF {totalAmount.toFixed(2)}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            This is a demo payment. No actual transaction will be processed.
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Payment;
