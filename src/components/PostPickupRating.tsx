import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Heart, Star, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface PostPickupRatingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  mealTitle: string;
  chefName: string;
  exchangeMode: string;
  pricingMinimum?: number;
  pricingSuggested?: number;
}

export const PostPickupRating = ({
  open,
  onOpenChange,
  bookingId,
  mealTitle,
  chefName,
  exchangeMode,
  pricingMinimum = 7,
  pricingSuggested,
}: PostPickupRatingProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  // Determine min/max based on exchange mode
  const minAmount = 7; // Platform minimum
  const maxAmount = Math.max(50, (pricingSuggested || 20) * 2);
  const defaultAmount = Math.max(pricingMinimum, pricingSuggested || 10, minAmount);
  
  const [amount, setAmount] = useState(defaultAmount);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Is this a bonus payment (Money mode) or initial payment (Barter mode)?
  const isBarterMode = exchangeMode === "barter";
  
  const serviceFee = 2;
  const totalAmount = amount + serviceFee;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Update booking with payment amount
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({ 
          payment_amount: amount,
          status: "completed",
          payout_status: "accumulating"
        })
        .eq("id", bookingId);

      if (bookingError) throw bookingError;

      // Award bonus karma for generous payment
      if (amount > (pricingMinimum || 7)) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("karma")
            .eq("id", user.id)
            .single();
          
          if (profile) {
            await supabase
              .from("profiles")
              .update({ karma: (profile.karma || 100) + 5 })
              .eq("id", user.id);
          }
        }
      }

      toast.success(
        isBarterMode 
          ? t("postPickup.thanks_barter", { chef: chefName })
          : t("postPickup.thanks_bonus", { chef: chefName }),
        { duration: 4000 }
      );

      // Bonus karma notification
      if (amount > (pricingMinimum || 7)) {
        setTimeout(() => {
          toast("💚 +5 Karma für deine Großzügigkeit!", { duration: 3000 });
        }, 1500);
      }

      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["booking"] });
      onOpenChange(false);
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(t("postPickup.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    toast.info(t("postPickup.skipped"), { duration: 3000 });
    onOpenChange(false);
  };

  // Quick amount suggestions
  const quickAmounts = [
    { value: minAmount, label: `CHF ${minAmount}` },
    { value: Math.round((minAmount + maxAmount) / 3), label: `CHF ${Math.round((minAmount + maxAmount) / 3)}` },
    { value: Math.round((minAmount + maxAmount) / 2), label: `CHF ${Math.round((minAmount + maxAmount) / 2)}` },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            {isBarterMode ? (
              <Heart className="w-8 h-8 text-primary" />
            ) : (
              <Sparkles className="w-8 h-8 text-primary" />
            )}
          </div>
          <DialogTitle className="text-xl">
            {isBarterMode 
              ? t("postPickup.title_barter")
              : t("postPickup.title_bonus")
            }
          </DialogTitle>
          <DialogDescription className="text-center">
            {isBarterMode 
              ? t("postPickup.desc_barter", { meal: mealTitle, chef: chefName })
              : t("postPickup.desc_bonus", { meal: mealTitle, chef: chefName })
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Amount Display */}
          <div className="text-center">
            <div className="text-5xl font-bold text-primary mb-2">
              CHF {amount}
            </div>
            <p className="text-sm text-muted-foreground">
              + CHF {serviceFee} {t("postPickup.service_fee")}
            </p>
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex justify-center gap-2">
            {quickAmounts.map((qa) => (
              <Button
                key={qa.value}
                variant={amount === qa.value ? "default" : "outline"}
                size="sm"
                onClick={() => setAmount(qa.value)}
              >
                {qa.label}
              </Button>
            ))}
          </div>

          {/* Slider */}
          <div className="px-2">
            <Slider
              min={minAmount}
              max={maxAmount}
              step={1}
              value={[amount]}
              onValueChange={([val]) => setAmount(val)}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>CHF {minAmount}</span>
              <span>CHF {maxAmount}</span>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("postPickup.your_contribution")}:</span>
              <span className="font-medium">CHF {amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("postPickup.service_fee")}:</span>
              <span>CHF {serviceFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold border-t border-border pt-2">
              <span>{t("postPickup.total")}:</span>
              <span className="text-primary">CHF {totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t("postPickup.chef_receives")}:</span>
              <span>CHF {amount.toFixed(2)}</span>
            </div>
          </div>

          {/* Karma Bonus Info */}
          {amount > (pricingMinimum || 7) && (
            <div className="flex items-center justify-center gap-2 text-sm text-primary">
              <Star className="w-4 h-4 fill-current" />
              <span>{t("postPickup.karma_bonus")}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Button 
            onClick={handleSubmit} 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? t("common.loading") : t("postPickup.confirm_payment")}
          </Button>
          
          {isBarterMode && (
            <Button 
              variant="ghost" 
              onClick={handleSkip}
              className="w-full text-muted-foreground"
            >
              {t("postPickup.skip_for_now")}
            </Button>
          )}
        </div>

        <p className="text-xs text-center text-muted-foreground">
          🔒 {t("postPickup.secure_payment")}
        </p>
      </DialogContent>
    </Dialog>
  );
};
