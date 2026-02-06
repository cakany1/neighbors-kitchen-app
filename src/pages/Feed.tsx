import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { MealCard } from "@/components/MealCard";
import { SkeletonMealCard } from "@/components/SkeletonMealCard";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Lock, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { getDistance } from "@/utils/distance";
import { OnboardingTour } from "@/components/OnboardingTour";
import { toast } from "sonner";
import { DEMO_MEALS } from "@/data/demoMeals";

const Feed = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isGuestMode = searchParams.get("guest") === "true";
  const [showDisclaimer, setShowDisclaimer] = useState(() => {
    return !localStorage.getItem("disclaimerSeen");
  });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [filterSameAddress, setFilterSameAddress] = useState(false);

  // Fetch current user for allergens
  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      if (isGuestMode) return null; // Skip auth check in guest mode

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

      return { ...user, profile };
    },
  });

  // Check if user is admin (skip onboarding for admins unless explicitly requested)
  const { data: isAdmin } = useQuery({
    queryKey: ["isAdmin", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", currentUser.id)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
    enabled: !!currentUser?.id,
  });

  // Check if user just registered or logged in (show onboarding tour)
  // FIX: Only show on first registration or explicit restart, not on every login
  useEffect(() => {
    const hasSeenTour = localStorage.getItem("tour_completed");
    const justRegistered = localStorage.getItem("just_registered");
    const forceShowTour = localStorage.getItem("force_show_tour");

    if (currentUser && !isGuestMode) {
      // Skip tour for admins unless they explicitly requested it via "Restart Tutorial"
      if (isAdmin && !forceShowTour) {
        return;
      }

      if (forceShowTour === "true") {
        localStorage.removeItem("force_show_tour");
        setTimeout(() => setShowOnboarding(true), 500);
      } else if (justRegistered === "true") {
        localStorage.removeItem("just_registered");
        // Only show tour on first registration
        setTimeout(() => setShowOnboarding(true), 500);
      }
      // REMOVED: else if (!hasSeenTour) - this caused tour to show on every login
    }
  }, [currentUser, isGuestMode, isAdmin]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    localStorage.setItem("tour_completed", "true");
  };

  // Fetch meals from database
  const { data: meals, isLoading } = useQuery({
    queryKey: ["meals", currentUser?.id, filterSameAddress],
    queryFn: async () => {
      let blockedUserIds: string[] = [];
      let usersWhoBlockedMe: string[] = [];

      if (currentUser?.id) {
        const { data: blockedByMe } = await supabase
          .from("blocked_users")
          .select("blocked_id")
          .eq("blocker_id", currentUser.id);

        if (blockedByMe) blockedUserIds = blockedByMe.map((b) => b.blocked_id);

        const { data: blockedMe } = await supabase
          .from("blocked_users")
          .select("blocker_id")
          .eq("blocked_id", currentUser.id);

        if (blockedMe) usersWhoBlockedMe = blockedMe.map((b) => b.blocker_id);
      }

      const allBlockedUsers = [...blockedUserIds, ...usersWhoBlockedMe];

      // SECURITY: Use meals_public view to prevent exact_address exposure
      let query = supabase
        .from("meals_public")
        .select(
          `
          id,
          title,
          title_en,
          description,
          description_en,
          image_url,
          chef_id,
          fuzzy_lat,
          fuzzy_lng,
          neighborhood,
          tags,
          allergens,
          available_portions,
          pricing_minimum,
          pricing_suggested,
          is_cooking_experience,
          scheduled_date,
          created_at,
          updated_at,
          handover_mode,
          exchange_mode,
          visibility_mode,
          visibility_radius,
          address_id,
          chef:profiles_public!chef_id (
            first_name,
            last_name,
            nickname,
            karma,
            id_verified,
            phone_verified,
            gender
          )
        `,
        )
        .order("created_at", { ascending: false });

      // Filter by same address if enabled and user has an address_id
      if (filterSameAddress && currentUser?.profile?.address_id) {
        query = query.eq("address_id", currentUser.profile.address_id);
      }

      if (allBlockedUsers.length > 0) {
        query = query.not("chef_id", "in", `(${allBlockedUsers.join(",")})`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const userAllergens = currentUser?.profile?.allergens || [];
  const userLat = currentUser?.profile?.latitude;
  const userLon = currentUser?.profile?.longitude;
  const userRadius = currentUser?.profile?.notification_radius || 5000;

  const safeDemoMeals = Array.isArray(DEMO_MEALS) ? DEMO_MEALS : [];
  const finalMeals = meals && meals.length > 0 ? meals : safeDemoMeals;

  const filteredAndSortedMeals = useMemo(() => {
    if (!finalMeals || finalMeals.length === 0) return [];

    const viewerGender = currentUser?.profile?.gender;
    const visibilityFilteredMeals = finalMeals.filter((meal) => {
      const mealVisibility = (meal as any).visibility_mode || "all";
      if (mealVisibility === "women_only") return viewerGender === "woman";
      if (mealVisibility === "women_fli") return viewerGender === "woman" || viewerGender === "diverse";
      return true;
    });

    if (!userLat || !userLon) return visibilityFilteredMeals || [];

    const mealsWithDistance = visibilityFilteredMeals
      .map((meal) => {
        // Use meal's fuzzy location for distance calculation
        const mealLat = meal.fuzzy_lat;
        const mealLon = meal.fuzzy_lng;

        if (!mealLat || !mealLon) return null;

        return {
          ...meal,
          calculatedDistance: getDistance(userLat, userLon, mealLat, mealLon),
        };
      })
      .filter((meal): meal is NonNullable<typeof meal> => meal !== null);

    // Apply chef-side visibility radius filter (if set)
    const radiusFilteredMeals = mealsWithDistance.filter((meal) => {
      const chefVisibilityRadius = (meal as any).visibility_radius;
      // If chef set a visibility radius, only show to users within that distance
      if (chefVisibilityRadius && chefVisibilityRadius > 0) {
        return meal.calculatedDistance <= chefVisibilityRadius;
      }
      return true; // No chef-side limit
    });

    // Apply user-side notification radius filter
    const withinRadius = radiusFilteredMeals.filter((meal) => meal.calculatedDistance <= userRadius);

    if (withinRadius.length === 0 && radiusFilteredMeals.length > 0) {
      const fallbackMeals = radiusFilteredMeals
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      if (fallbackMeals.length > 0) {
        setTimeout(() => {
          toast.info(t("feed_page.no_hits_nearby"), { duration: 5000 });
        }, 500);
      }
      return fallbackMeals;
    }

    return withinRadius.sort((a, b) => a.calculatedDistance - b.calculatedDistance);
  }, [finalMeals, userLat, userLon, userRadius, currentUser]);

  const handleDismissDisclaimer = () => {
    localStorage.setItem("disclaimerSeen", "true");
    setShowDisclaimer(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <main className="max-w-lg mx-auto px-4 py-6">
        {showDisclaimer && (
          <Alert className="mb-6 border-primary bg-primary-light" onClick={handleDismissDisclaimer}>
            <AlertCircle className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm text-foreground">
              <strong>{t("feed_page.welcome_message")}</strong>
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">{t("feed.available_meals")}</h2>
          <p className="text-muted-foreground">
            {t("feed.fresh_meals_subtitle")}
            {userLat && userLon && ` (within ${userRadius / 1000}km)`}
          </p>
        </div>

        {/* TASK 18: Same-Address Filter Toggle - Always visible for logged-in users */}
        {currentUser && (
          <div className="mb-4">
            <button
              onClick={() => {
                if (!currentUser?.profile?.address_id) {
                  toast.info(t("feed.no_address_set", "Bitte zuerst eine Adresse im Profil setzen"));
                  return;
                }
                setFilterSameAddress(!filterSameAddress);
              }}
              className={`w-full p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                filterSameAddress && currentUser?.profile?.address_id
                  ? 'border-secondary bg-secondary/10'
                  : 'border-border hover:border-secondary/50'
              } ${!currentUser?.profile?.address_id ? 'opacity-60' : ''}`}
            >
              <Home className="w-4 h-4" />
              <span className="font-medium text-sm">
                {filterSameAddress && currentUser?.profile?.address_id 
                  ? t("feed.my_address_only", "Nur meine Adresse") 
                  : t("feed.all_meals", "Alle Gerichte")}
              </span>
              {!currentUser?.profile?.address_id && (
                <span className="text-xs text-muted-foreground ml-auto">
                  ({t("feed.no_address_hint", "keine Adresse")})
                </span>
              )}
            </button>
            
            {/* DEBUG BLOCK - TASK 18.1 VERIFICATION */}
            <div className="mt-2 p-3 bg-warning/20 border border-warning rounded text-xs font-mono">
              <div className="font-bold text-warning-foreground mb-1">🔍 TASK 18 DEBUG:</div>
              <div>my_profile_address_id: <strong>{currentUser?.profile?.address_id || 'NULL'}</strong></div>
              <div>first_feed_meal_address_id: <strong>{meals?.[0]?.address_id || 'NULL'}</strong></div>
              <div>filterSameAddress: <strong>{filterSameAddress ? 'ON' : 'OFF'}</strong></div>
              <div>total_meals_shown: <strong>{filteredAndSortedMeals?.length || 0}</strong></div>
            </div>
          </div>
        )}

        {!userLat || !userLon ? (
          <Alert className="mb-6 border-warning bg-warning/10">
            <AlertCircle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-sm">
              <strong>{t("feed.set_location")}</strong> {t("feed.set_location_desc")}
            </AlertDescription>
          </Alert>
        ) : null}

        {isLoading ? (
          <div className="grid gap-4">
            <SkeletonMealCard />
            <SkeletonMealCard />
            <SkeletonMealCard />
          </div>
        ) : !filteredAndSortedMeals || filteredAndSortedMeals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">{t("feed.no_meals_radius", { radius: userRadius / 1000 })}</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {(filteredAndSortedMeals || []).map((meal) => (
              <MealCard
                key={meal.id}
                meal={{
                  id: meal.id,
                  title: isGuestMode
                    ? meal.title
                        .split(" ")
                        .map((_, i) => (i < 2 ? "█████" : _))
                        .join(" ")
                    : meal.title,
                  description: isGuestMode ? meal.description.slice(0, 50) + "..." : meal.description,
                  chef: {
                    firstName: meal.chef?.first_name || "Chef",
                    lastName: meal.chef?.last_name || "",
                    karma: meal.chef?.karma || 0,
                    isVerified: meal.chef?.id_verified || meal.chef?.phone_verified || false,
                  },
                  location: {
                    neighborhood: meal.neighborhood,
                    fuzzyLat: parseFloat(String(meal.fuzzy_lat)),
                    fuzzyLng: parseFloat(String(meal.fuzzy_lng)),
                  },
                  distance: "calculatedDistance" in meal ? ((meal as any).calculatedDistance as number) : undefined,
                  tags: meal.tags || [],
                  imageUrl: meal.image_url || undefined,
                  pricing: {
                    minimum: meal.pricing_minimum || 0,
                    suggested: meal.pricing_suggested || undefined,
                  },
                  exchange_mode: (meal as any).exchange_mode || 'money',
                  handover_mode: (meal as any).handover_mode || 'pickup',

                  isCookingExperience: meal.is_cooking_experience,
                  availablePortions: meal.available_portions,
                  allergens: meal.allergens || [],
                  scheduledDate: meal.scheduled_date,
                }}
                onClick={() => {
                  if (isGuestMode) {
                    setShowGuestModal(true);
                  } else {
                    navigate(`/meal/${meal.id}`);
                  }
                }}
                userAllergens={userAllergens}
              />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
      {showOnboarding && <OnboardingTour onComplete={handleOnboardingComplete} />}
      <Dialog open={showGuestModal} onOpenChange={setShowGuestModal}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <Lock className="w-12 h-12 text-primary" />
            </div>
            <DialogTitle className="text-center text-2xl">{t("feed_page.guest_modal_title")}</DialogTitle>
            <DialogDescription className="text-center">{t("feed_page.guest_modal_desc")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button onClick={() => navigate("/signup")} size="lg">
              {t("feed_page.register_now")}
            </Button>
            <Button variant="outline" onClick={() => navigate("/login")} size="lg">
              {t("feed_page.already_have_account")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Feed;
