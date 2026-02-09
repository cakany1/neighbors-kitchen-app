import { Meal } from "@/types/meal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, ChefHat, Package, Home, Ghost, UtensilsCrossed, Sparkles, Camera } from "lucide-react";
import { VerificationBadge } from "@/components/VerificationBadge";
import { KarmaLevel } from "@/components/KarmaLevel";
import { RatingSummary } from "@/components/RatingSummary";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface MealCardProps {
  meal: Meal;
  onClick: () => void;
  userAllergens?: string[];
}

export const MealCard = ({ meal, onClick, userAllergens = [] }: MealCardProps) => {
  const { t, i18n } = useTranslation();
  const [showOriginal, setShowOriginal] = useState(false);

  // Helper to safely access properties
  const getProp = (obj: any, camelKey: string, snakeKey: string) => {
    return obj?.[camelKey] !== undefined ? obj[camelKey] : obj?.[snakeKey];
  };

  const titleEn = getProp(meal, "titleEn", "title_en");
  const displayTitle = !showOriginal && i18n.language === "en" && titleEn ? titleEn : meal.title;

  const exchangeMode = (meal as any).exchangeMode || (meal as any).exchange_mode || "money";
  const handoverMode = (meal as any).handoverMode || (meal as any).handover_mode || "pickup_box";

  const chef = meal.chef || {};
  const chefNickname = getProp(chef, "nickname", "nickname") || getProp(chef, "firstName", "first_name") || "Chef";
  const chefIsVerified = getProp(chef, "isVerified", "id_verified") || false;
  const chefKarma = getProp(chef, "karma", "karma") || 0;

  const imageUrl = getProp(meal, "imageUrl", "image_url");
  const availablePortions = getProp(meal, "availablePortions", "available_portions");
  const isAiGenerated = getProp(meal, "isAiGenerated", "is_ai_generated") || false;
  const isStockPhoto = getProp(meal, "isStockPhoto", "is_stock_photo") || false;

  // Pricing Logic - DB stores values in cents (e.g., 1200 = CHF 12.00)
  // Mock data uses CHF directly (e.g., 12 = CHF 12.00)
  const pricing = meal.pricing || {};
  const pricingMinRaw =
    getProp(pricing, "minimum", "pricing_minimum") ?? getProp(meal, "pricingMinimum", "pricing_minimum") ?? 0;
  // If value > 100, it's likely cents from DB; otherwise it's CHF from mock data
  const pricingMinCents = Number(pricingMinRaw) > 100 ? Number(pricingMinRaw) : Number(pricingMinRaw) * 100;
  const minPrice = (pricingMinCents / 100).toFixed(2);

  // Estimated restaurant value - stored in cents in DB, CHF in mock data
  const estimatedValueRaw = (meal as any).estimated_restaurant_value || (meal as any).estimatedRestaurantValue || 0;
  const estimatedValueCHF = Number(estimatedValueRaw) > 100 ? Number(estimatedValueRaw) / 100 : Number(estimatedValueRaw);

  const location = meal.location || {};
  const neighborhood =
    getProp(location, "neighborhood", "neighborhood") || getProp(meal, "neighborhood", "neighborhood") || "Basel";

  const handoverIcons = {
    pickup_box: Package,
    neighbor_plate: Home,
    anonymous_drop: Ghost,
    dine_in: UtensilsCrossed,
    pickup: Package,
    neighbor: Home,
  };
  const HandoverIcon = handoverIcons[handoverMode as keyof typeof handoverIcons] || Package;

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-border group"
      onClick={onClick}
    >
      {/* Image Area */}
       <div className="relative h-48 bg-muted">
        {imageUrl ? (
          <img src={imageUrl} alt={meal.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ChefHat className="w-16 h-16 text-muted-foreground" />
          </div>
        )}
        {/* Top Right Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {availablePortions > 0 && (
            <Badge className="bg-primary/90 backdrop-blur text-primary-foreground font-bold shadow-sm">
              {availablePortions} {t("meal.portionsAvailable", "left")}
            </Badge>
          )}
        </div>
        {/* Top Left - AI/Stock Badge */}
        <div className="absolute top-3 left-3 flex gap-2">
          {isAiGenerated && (
            <Badge className="bg-amber-500/90 backdrop-blur text-white border-0 flex items-center gap-1 shadow-sm">
              <Sparkles className="w-3 h-3" />
              KI
            </Badge>
          )}
          {isStockPhoto && !isAiGenerated && (
            <Badge variant="secondary" className="bg-muted/90 backdrop-blur border-0 shadow-sm">
              📷 {t("meal.stockPhoto", "Symbolbild")}
            </Badge>
          )}
          {!isAiGenerated && !isStockPhoto && imageUrl && (
            <Badge className="bg-green-500/90 backdrop-blur text-white border-0 flex items-center gap-1 shadow-sm">
              <Camera className="w-3 h-3" />
              {t("meal.realPhoto", "Echt")}
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        {/* Header */}
        <div className="mb-2">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-lg leading-tight mb-1 text-foreground">{displayTitle}</h3>
          </div>

          {/* Short description */}
          {meal.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {!showOriginal && i18n.language === "en" && (meal as any).descriptionEn
                ? (meal as any).descriptionEn
                : meal.description}
            </p>
          )}

          {/* AI Preview Thumbnail — small inline image if AI-generated */}
          {isAiGenerated && imageUrl && (
            <div className="mb-2 flex items-center gap-2">
              <img
                src={imageUrl}
                alt="AI preview"
                className="w-10 h-10 rounded object-cover border border-border"
                loading="lazy"
              />
              <span className="text-[10px] text-muted-foreground italic">
                {t("meal.ai_preview", "KI-Vorschau")}
              </span>
            </div>
          )}

          <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
             <div className="flex items-center gap-2">
               <span className="font-medium text-foreground flex items-center gap-1">
                 {chefNickname}
                 {chefIsVerified && <VerificationBadge isVerified={true} size="sm" />}
               </span>
               <span>•</span>
               <span className="flex items-center gap-1">
                 <MapPin className="w-3 h-3" />
                 {neighborhood}
               </span>
             </div>
             <div className="flex items-center gap-3">
               <KarmaLevel karma={chefKarma} size="sm" showLabel={false} />
               <RatingSummary userId={getProp(chef, "id", "id")} role="chef" size="sm" showLabel={false} />
             </div>
           </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {(meal.tags || []).map((tag, idx) => {
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

        {/* BADGE LOGIC - ZENTRIERT & CLEAN */}
        <div className="mb-3 w-full">
          {exchangeMode === "barter" ? (
            <div className="flex items-center justify-center w-full gap-2 py-2 px-3 bg-secondary/10 rounded-lg text-center">
              <span className="text-sm font-semibold text-secondary">
                {t("landing.badge_surprise_me")}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full gap-2 py-2 px-3 bg-muted rounded-lg text-center">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-muted-foreground">{t("common.fixedPrice", "Festpreis")}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-border mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <HandoverIcon className="w-4 h-4" />
              <span className="capitalize">{handoverMode.replace("_", " ")}</span>
            </div>
            <div className="font-semibold text-right">
              {exchangeMode === "money" && Number(minPrice) > 0 ? (
                <span className="flex flex-col items-end leading-tight">
                  <span className="text-xs text-muted-foreground font-normal">Online Payment</span>
                  <span className="text-primary">CHF {minPrice}</span>
                </span>
              ) : estimatedValueCHF > 0 ? (
                <span className="flex flex-col items-end leading-tight">
                  <span className="text-xs text-muted-foreground font-normal">{t("meal_detail.estimated_value", "Geschätzter Wert")}</span>
                  <span className="text-secondary">~CHF {estimatedValueCHF.toFixed(0)}.-</span>
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
