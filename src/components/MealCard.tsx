import { Meal } from "@/types/meal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Star,
  MapPin,
  ChefHat,
  Calendar,
  Gift,
  Heart,
  Camera,
  Package,
  Home,
  Ghost,
  UtensilsCrossed,
  Languages,
} from "lucide-react";
import { TranslateButton } from "@/components/TranslateButton";
import { VerificationBadge } from "@/components/VerificationBadge";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatDistance } from "@/utils/distance";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface MealCardProps {
  meal: Meal;
  onClick: () => void;
  userAllergens?: string[];
}

export const MealCard = ({ meal, onClick, userAllergens = [] }: MealCardProps) => {
  const { t, i18n } = useTranslation();
  const [showOriginal, setShowOriginal] = useState(false);

  // Display logic for title
  const displayTitle =
    !showOriginal && i18n.language === "en" && (meal as any).title_en ? (meal as any).title_en : meal.title;

  // FIX: Direct access to real data (No Mock Data Override!)
  const exchangeMode = (meal as any).exchange_mode || "money";
  const isStockPhoto = (meal as any).is_stock_photo || false;
  const handoverMode = (meal as any).handover_mode || "pickup_box";
  const chefNickname = (meal.chef as any)?.nickname || meal.chef?.first_name || "Chef";

  // Icon mapping
  const handoverIcons = {
    pickup_box: Package,
    neighbor_plate: Home,
    anonymous_drop: Ghost,
    dine_in: UtensilsCrossed,
    pickup: Package,
    neighbor: Home,
  };
  const HandoverIcon = handoverIcons[handoverMode as keyof typeof handoverIcons] || Package;

  // Safe price display
  const minPrice = (meal.pricing?.minimum || 7).toFixed(2);

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-border group"
      onClick={onClick}
    >
      {/* Image Area */}
      <div className="relative h-48 bg-muted">
        {meal.image_url || meal.imageUrl ? (
          <img src={meal.image_url || meal.imageUrl} alt={meal.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ChefHat className="w-16 h-16 text-muted-foreground" />
          </div>
        )}

        {/* Badges Top Right */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {meal.availablePortions > 0 && (
            <Badge className="bg-primary/90 backdrop-blur text-primary-foreground font-bold shadow-sm">
              {meal.available_portions} {t("meal.portionsAvailable", "left")}
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        {/* Header */}
        <div className="mb-2">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-lg leading-tight mb-1 text-foreground">{displayTitle}</h3>
            {meal.chef.karma > 0 && (
              <div className="flex items-center gap-1 text-amber-500 text-xs font-medium bg-amber-50 px-1.5 py-0.5 rounded">
                <Star className="w-3 h-3 fill-current" /> {meal.chef.karma}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground flex items-center gap-1">
              {chefNickname}
              {meal.chef.isVerified && <VerificationBadge isVerified={true} size="sm" />}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {(meal as any).neighborhood || meal.location?.neighborhood || "Basel"}
            </span>
          </div>
        </div>

        {/* TAGS - CORRECT RENDERING (Badges) */}
        <div className="flex flex-wrap gap-2 mb-3">
          {(meal.tags || []).map((tag, idx) => {
            // Remove prefix if present and capitalize
            const cleanTag = tag.replace("tag_", "");
            const label = cleanTag.charAt(0).toUpperCase() + cleanTag.slice(1);
            return (
              <Badge
                key={`${tag}-${idx}`}
                variant="secondary"
                className="px-2 py-0.5 text-xs font-normal border-0 bg-secondary/50"
              >
                {t(`tags.${tag}`, label)}
              </Badge>
            );
          })}
        </div>

        {/* BADGE LOGIC - CORRECT PLACEMENT */}
        <div className="mb-3">
          {(meal.pricing?.minimum || 0) === 0 ? (
            <div className="flex items-center justify-center gap-2 py-2 px-3 bg-secondary/10 rounded-lg">
              <Gift className="w-4 h-4 text-secondary fill-current" />
              <span className="text-sm font-semibold text-secondary">{t("meal_card.free_with_smile")}</span>
            </div>
          ) : exchangeMode === "pay_what_you_want" ? (
            <div className="flex items-center justify-center gap-2 py-2 px-3 bg-primary/10 rounded-lg">
              <Heart className="w-4 h-4 text-primary fill-current" />
              <span className="text-sm font-semibold text-primary">{t("common.payWhatYouWant")}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 py-2 px-3 bg-muted rounded-lg">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-muted-foreground">{t("common.fixedPrice", "Festpreis")}</span>
            </div>
          )}
        </div>

        {/* Footer & Price */}
        <div className="pt-3 border-t border-border mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <HandoverIcon className="w-4 h-4" />
              <span className="capitalize">{handoverMode.replace("_", " ")}</span>
            </div>

            {/* Logic for Payment Text */}
            <div className="font-semibold text-primary text-right">
              {exchangeMode === "pay_what_you_want" || exchangeMode === "money" ? (
                <span className="flex flex-col items-end leading-tight">
                  <span className="text-xs text-muted-foreground font-normal">Online Payment</span>
                  <span>Min. CHF {minPrice}</span>
                </span>
              ) : (
                <span>{t("meal.exchange", "Exchange")}</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
