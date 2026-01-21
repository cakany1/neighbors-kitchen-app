import { MapPin, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DEMO_MEALS } from "@/data/demoMeals";

export const HeroFeedTeaser = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Transform demo meals for hero display with translations
  const heroMeals =
    DEMO_MEALS && Array.isArray(DEMO_MEALS)
      ? DEMO_MEALS.map((meal, index) => {
          return {
            id: meal.id,
            image: meal.image_url,
            title: meal.title,
            exchangeMode: meal.exchange_mode,
            pricingMinimum: meal.pricing_minimum,
            chef: meal.chef?.nickname || meal.chef?.first_name,
            location: meal.neighborhood,
            tags: meal.tags || [],
            delay: `${index * 0.2}s`,
          };
        })
      : [];

  if (!heroMeals || heroMeals.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-6xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {heroMeals.map((meal) => (
          <Card
            key={meal.id}
            onClick={() => navigate(`/meal/${meal.id}`)}
            className="group relative overflow-hidden bg-background/60 backdrop-blur-md border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-float cursor-pointer"
            style={{ animationDelay: meal.delay }}
          >
            <CardContent className="p-0">
              <div className="relative">
                <img src={meal.image} alt={meal.title} className="w-full h-48 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="text-foreground font-semibold text-lg">{t("landing.book_now")}</span>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-base text-foreground line-clamp-1">{meal.title}</h3>
                
                {/* Centered badge for surprise/pwyw modes */}
                {meal.exchangeMode === "barter" && (
                  <div className="w-full flex justify-center mt-1.5">
                    <Badge variant="secondary" className="bg-primary/20 text-primary text-xs border-0">
                      {t("landing.badge_surprise_me")}
                    </Badge>
                  </div>
                )}

                {/* Price display for fixed mode only */}
                {meal.exchangeMode === "money" && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-primary">
                      {meal.pricingMinimum ? `CHF ${meal.pricingMinimum.toFixed(2)}` : ""}
                    </p>
                    <Badge variant="secondary" className="bg-primary/20 text-primary w-fit text-xs border-0">
                      {t("common.fixedPrice", "Festpreis")}
                    </Badge>
                  </div>
                )}

                {/* TAGS: Properly iterate and translate */}
                <div className="flex flex-wrap gap-2">
                  {meal.tags.map((tag, idx) => {
                    // Check if tag is a translation key (starts with 'tag_')
                    const displayTag = tag.startsWith("tag_")
                      ? t(
                          `tags.${tag}`,
                          tag.replace("tag_", "").charAt(0).toUpperCase() + tag.replace("tag_", "").slice(1),
                        )
                      : tag;
                    return (
                      <Badge key={`${tag}-${idx}`} variant="outline" className="text-xs">
                        {displayTag}
                      </Badge>
                    );
                  })}
                </div>

                <div className="flex items-center gap-3 text-sm text-muted-foreground pt-1">
                  <div className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    <span className="text-xs">{meal.chef}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-xs">{meal.location}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
