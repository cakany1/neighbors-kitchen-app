import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { SafetyAlert } from "@/components/SafetyAlert";
import { TranslateButton } from "@/components/TranslateButton";
import { ReportDialog } from "@/components/ReportDialog";
import { AuthInterstitialModal } from "@/components/AuthInterstitialModal";
import { ProfileWizard } from "@/components/ProfileWizard";
import { checkAllergenMatch } from "@/utils/ingredientDatabase";
import FuzzyLocationMap from "@/components/maps/FuzzyLocationMap";
import ChatModal from "@/components/ChatModal";
import {
  MapPin,
  Star,
  ChefHat,
  Clock,
  AlertTriangle,
  CheckCircle,
  Home,
  MessageCircle,
  Calendar,
  Gift,
  Flag,
  Languages,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { DEMO_MEALS } from "@/data/demoMeals";

const MealDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [bookingStatus, setBookingStatus] = useState<"none" | "pending" | "confirmed">("none");
  const [chatOpen, setChatOpen] = useState(false);
  const [bookingQuantity, setBookingQuantity] = useState(1);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileWizardOpen, setProfileWizardOpen] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  // Use pre-translated content based on current language, but respect showOriginal toggle
  const getDisplayText = (originalText: string, translatedText: string | null | undefined) => {
    return !showOriginal && i18n.language === "en" && translatedText ? translatedText : originalText;
  };

  // Fetch current user - SECURITY: Own profile can access all fields
  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      // User can access their own full profile
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

      return { ...user, profile };
    },
  });

  // Fetch meal data with chef - SECURITY: Never fetch exact_address here
  // GUEST MODE: Check demo meals first
  const { data: meal, isLoading } = useQuery({
    queryKey: ["meal", id],
    queryFn: async () => {
      // Check if this is a demo meal (with safety check)
      const safeDemoMeals = DEMO_MEALS && Array.isArray(DEMO_MEALS) ? DEMO_MEALS : [];
      const demoMeal = safeDemoMeals.find((m) => m.id === id);
      if (demoMeal) {
        return demoMeal;
      }

      // SECURITY: Use meals_public view to prevent exact_address exposure
      const { data, error } = await supabase
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
          collection_window_start,
          collection_window_end,
          arrival_time,
          max_seats,
          booked_seats,
          unit_type,
          exchange_mode,
          barter_requests,
          restaurant_reference_price,
          estimated_restaurant_value,
          ingredients,
          is_stock_photo,
          women_only,
          chef:profiles_public!chef_id (
            first_name,
            last_name,
            nickname,
            karma,
            display_real_name,
            id_verified,
            phone_verified
          )
        `,
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // SECURITY: Only fetch exact address AFTER booking is confirmed
  const { data: confirmedAddress } = useQuery({
    queryKey: ["mealAddress", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("meals").select("exact_address").eq("id", id).single();

      if (error) throw error;
      return data;
    },
    enabled: bookingStatus === "confirmed",
  });

  // Fetch existing booking if any
  const { data: existingBooking } = useQuery({
    queryKey: ["booking", id, currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return null;

      const { data } = await supabase
        .from("bookings")
        .select("*")
        .eq("meal_id", id)
        .eq("guest_id", currentUser.id)
        .maybeSingle();

      return data;
    },
    enabled: !!currentUser?.id,
  });

  // Update booking status when existingBooking changes
  useEffect(() => {
    if (existingBooking) {
      if (existingBooking.status === "confirmed") {
        setBookingStatus("confirmed");
      } else if (existingBooking.status === "pending") {
        setBookingStatus("pending");
      }
    }
  }, [existingBooking]);

  // Set default quantity for couples
  useEffect(() => {
    if (currentUser?.profile?.is_couple) {
      setBookingQuantity(2);
    }
  }, [currentUser?.profile?.is_couple]);

  const matchingAllergens = checkAllergenMatch(meal?.allergens || [], currentUser?.profile?.allergens || []);

  const bookingMutation = useMutation({
    mutationFn: async () => {
      // CRITICAL: Double-check auth before DB operations
      if (!currentUser?.id || !meal) {
        throw new Error("Missing user or meal");
      }

      // BOOKING GATE: Check profile completion
      const profile = currentUser.profile;
      const isProfileComplete = profile?.phone_number && profile?.private_address && profile?.private_city;

      if (!isProfileComplete) {
        toast.error(t("toast.profile_incomplete"));
        navigate("/profile");
        throw new Error("Profile incomplete");
      }

      // Call secure booking function (prevents overbooking with row-level lock)
      const { data, error } = await supabase.rpc("book_meal", {
        p_meal_id: meal.id,
        p_guest_id: currentUser.id,
      });

      if (error) throw error;

      // Type the response
      const result = data as { success: boolean; message?: string; booking_id?: string };

      // Check function response
      if (!result.success) {
        throw new Error(result.message || "Booking failed");
      }

      return result;
    },
    onSuccess: () => {
      setBookingStatus("pending");
      toast.success(t("toast.booking_sent", { name: meal?.chef?.first_name || "" }));
      // Refresh meal data to show updated portion count
      queryClient.invalidateQueries({ queryKey: ["meal", id] });
      queryClient.invalidateQueries({ queryKey: ["booking", id, currentUser?.id] });
    },
    onError: (error: any) => {
      toast.error(error.message || t("toast.booking_failed"));
    },
  });

  // Check what profile data is missing
  const getMissingProfileData = () => {
    const profile = currentUser?.profile;
    return {
      missingPhoto: !profile?.avatar_url,
      missingAddress: !profile?.private_address || !profile?.private_city,
      missingPhone: !profile?.phone_number,
      isCouple: !!profile?.is_couple,
      partnerPhotoMissing: profile?.is_couple && !profile?.partner_photo_url,
    };
  };

  // Check if user is the chef (for self-booking prevention)
  const isOwnMeal = currentUser?.id === meal?.chef_id;

  const handleRequestBooking = () => {
    // AUTH GATEKEEPER: Show trust modal first if not logged in
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }

    // SELF-BOOKING BLOCK
    if (isOwnMeal) {
      toast.error("Du kannst dein eigenes Angebot nicht buchen.");
      return;
    }

    // DEMO LOCK: Prevent booking demo meals (check ID prefix)
    const isDemo = meal?.id?.startsWith("demo-");
    if (isDemo) {
      toast.info(t("meal_detail.demo_meal_notice"), {
        description: t("meal_detail.demo_meal_hint"),
        duration: 5000,
      });
      return;
    }

    // PORTIONS OVERFLOW CHECK
    if (bookingQuantity > (meal?.available_portions || 0)) {
      toast.error("Nicht genügend Portionen verfügbar.");
      return;
    }

    // PROFILE GATE: Only check address and phone (NOT photo, NOT partner photo)
    const profile = currentUser.profile;
    const isProfileComplete = profile?.phone_number && profile?.private_address && profile?.private_city;

    if (!isProfileComplete) {
      toast.error("Bitte vervollständige dein Profil (Telefon & Adresse) bevor du buchst.");
      navigate("/profile");
      return;
    }

    bookingMutation.mutate();
  };

  const handleProfileWizardComplete = () => {
    setProfileWizardOpen(false);
    // Refresh user data and trigger booking
    queryClient.invalidateQueries({ queryKey: ["currentUser"] }).then(() => {
      bookingMutation.mutate();
    });
  };

  // Cancel booking mutation
  const cancelBookingMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.id || !existingBooking?.id) throw new Error("Missing data");

      const { data, error } = await supabase.rpc("cancel_booking", {
        p_booking_id: existingBooking.id,
        p_guest_id: currentUser.id,
      });

      if (error) throw error;

      const result = data as { success: boolean; message?: string };

      if (!result.success) {
        throw new Error(result.message || "Cancellation failed");
      }

      return result;
    },
    onSuccess: () => {
      setBookingStatus("none");
      toast.success(t("toast.booking_cancelled"));
      // Refresh queries
      queryClient.invalidateQueries({ queryKey: ["meal", id] });
      queryClient.invalidateQueries({ queryKey: ["booking", id, currentUser?.id] });
    },
    onError: (error: any) => {
      toast.error(error.message || t("toast.cancel_failed"));
    },
  });

  const handleCancelBooking = () => {
    if (window.confirm(t("meal_detail.confirm_cancel"))) {
      cancelBookingMutation.mutate();
    }
  };

  // Delete meal mutation
  const deleteMealMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.id || !meal) throw new Error("Missing user or meal");

      const { error } = await supabase.from("meals").delete().eq("id", meal.id).eq("chef_id", currentUser.id); // Security: Only owner can delete

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("meal_detail.delete_success"));
      navigate("/app");
    },
    onError: (error: any) => {
      toast.error(error.message || t("meal_detail.delete_failed"));
    },
  });

  const handleDeleteMeal = () => {
    if (window.confirm(t("meal_detail.confirm_delete"))) {
      deleteMealMutation.mutate();
    }
  };

  // Calculate if booking is within 15-minute grace period
  const isWithinCancellationPeriod = existingBooking
    ? Date.now() - new Date(existingBooking.created_at).getTime() < 15 * 60 * 1000
    : false;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{t("meal_detail.loading")}</p>
      </div>
    );
  }

  if (!meal) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">{t("meal_detail.not_found")}</p>
          <Button onClick={() => navigate("/app")} className="mt-4">
            {t("meal_detail.back_to_feed")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-20">
      <Header />

      <main className="max-w-lg mx-auto pb-32 md:pb-4">
        {/* Hero Image */}
        <div className="relative h-64 md:h-auto md:max-h-[400px] bg-muted md:flex md:items-center md:justify-center">
          {meal.image_url ? (
            <img
              src={meal.image_url}
              alt={meal.title}
              className="w-full h-full object-cover md:object-contain md:max-h-[400px]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ChefHat className="w-20 h-20 text-muted-foreground" />
            </div>
          )}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            {meal.is_stock_photo && (
              <Badge className="bg-background/80 backdrop-blur">{t("meal_card.symbolic_image")}</Badge>
            )}
            {meal.available_portions > 0 && (
              <Badge className="bg-primary/90 backdrop-blur text-primary-foreground font-bold text-sm">
                {t("meal_detail.still_available")} {meal.available_portions}{" "}
                {meal.unit_type === "slices"
                  ? t("meal_detail.pieces")
                  : meal.unit_type === "items"
                    ? t("meal_detail.items")
                    : meal.unit_type === "whole"
                      ? t("meal_detail.whole")
                      : t("meal_detail.portions")}
              </Badge>
            )}
            {meal.available_portions === 0 && (
              <Badge className="bg-destructive/90 backdrop-blur text-destructive-foreground font-bold text-sm">
                {t("meal_detail.sold_out")}
              </Badge>
            )}
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Title & Chef */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">
                  {getDisplayText(meal.title, (meal as any).title_en)}
                </h1>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <ChefHat className="w-4 h-4" />
                <span
                  className="hover:text-primary cursor-pointer transition-colors"
                  onClick={() => navigate(`/profile/${meal.chef_id}`)}
                >
                  {t("meal_detail.by")} {meal.chef?.first_name} {meal.chef?.last_name?.charAt(0)}.
                </span>
                <Star className="w-4 h-4 fill-trust-gold text-trust-gold" />
                <span className="text-trust-gold font-semibold">{meal.chef?.karma || 0}</span>
              </div>
            </div>

            {/* Report or Delete Button */}
            <div className="flex gap-2">
              {currentUser?.id === meal.chef_id ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteMeal()}
                  className="text-muted-foreground hover:text-destructive"
                  title={t("meal_detail.delete")}
                >
                  <Flag className="w-5 h-5" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setReportDialogOpen(true)}
                  className="text-muted-foreground hover:text-destructive"
                  title={t("meal_detail.report")}
                >
                  <Flag className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>

          {/* Safety Alert */}
          {matchingAllergens.length > 0 && <SafetyAlert matchingAllergens={matchingAllergens} />}

          {/* Cooking Experience Badge */}
          {meal.is_cooking_experience && (
            <Alert className="border-primary bg-primary/5">
              <Home className="h-4 w-4 text-primary" />
              <AlertDescription>
                🍽️ <strong>{t("meal_card.cooking_experience")}</strong> - Watch and socialize in the kitchen!
              </AlertDescription>
            </Alert>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {meal.tags?.map((tag: string) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Beschreibung */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{t("meal_detail.about_dish")}</CardTitle>
                {/* Show translate button when UI language differs from original language */}
                {((i18n.language === "en" && (meal as any).description_en) ||
                  (i18n.language === "de" && (meal as any).description_en)) && (
                  <Button variant="ghost" size="sm" onClick={() => setShowOriginal(!showOriginal)}>
                    <Languages className="w-4 h-4 mr-2" />
                    {i18n.language === "en"
                      ? showOriginal
                        ? t("meal_detail.translate_to_english")
                        : t("meal_detail.show_original")
                      : showOriginal
                        ? t("meal_detail.show_original")
                        : t("meal_detail.translate_to_english")}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{getDisplayText(meal.description, (meal as any).description_en)}</p>
              {meal.allergens && meal.allergens.length > 0 && (
                <Alert className="mt-4 border-destructive/50 bg-destructive/5">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-sm">
                    <strong>{t("meal_detail.allergens_label")}:</strong> {meal.allergens.join(", ")}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Geplantes Datum */}
          {meal.scheduled_date && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  {t("meal_detail.available_on")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center">
                    <span className="text-xs font-medium text-primary">
                      {format(new Date(meal.scheduled_date), "MMM", {
                        locale: i18n.language === "en" ? enUS : de,
                      }).toUpperCase()}
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {format(new Date(meal.scheduled_date), "d", {
                        locale: i18n.language === "en" ? enUS : de,
                      })}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {format(new Date(meal.scheduled_date), "EEEE, d. MMMM yyyy", {
                        locale: i18n.language === "en" ? enUS : de,
                      })}
                    </p>
                    {(meal.collection_window_start || (meal as any).arrival_time) && (
                      <p className="text-sm text-muted-foreground mt-1">
                        <Clock className="w-3.5 h-3.5 inline mr-1" />
                        {meal.collection_window_start && meal.collection_window_end
                          ? `${meal.collection_window_start.slice(0, 5)} - ${meal.collection_window_end.slice(0, 5)} Uhr`
                          : (meal as any).arrival_time
                            ? `${(meal as any).arrival_time.slice(0, 5)} Uhr`
                            : ""}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Standort */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                {t("meal_detail.location")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium text-foreground">{meal.neighborhood}</p>

                {bookingStatus === "confirmed" ? (
                  <Alert className="border-secondary bg-secondary-light">
                    <Home className="h-4 w-4 text-secondary" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="text-foreground">
                          <strong className="text-secondary">Kontakt:</strong> {meal.chef?.first_name}{" "}
                          {meal.chef?.last_name}
                        </p>
                        <p className="text-foreground">
                          <strong className="text-secondary">Adresse:</strong> {confirmedAddress?.exact_address}
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="mt-4">
                    <FuzzyLocationMap
                      lat={parseFloat(String(meal.fuzzy_lat))}
                      lng={parseFloat(String(meal.fuzzy_lng))}
                      neighborhood={meal.neighborhood}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Surprise Block - Only for barter mode */}
          {meal.exchange_mode === "barter" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Gift className="w-5 h-5 text-primary" />
                  {t("meal.surprise")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="text-base py-1">
                  {t("meal_card.surprise_me")}
                </Badge>
              </CardContent>
            </Card>
          )}

          {/* Verfügbare Portionen */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">{t("meal.availablePortions")}</span>
            <span className="text-lg font-semibold text-foreground">{meal.available_portions}</span>
          </div>

          {/* Couple Booking Selector - Only show if portions available */}
          {currentUser?.profile?.is_couple && bookingStatus === "none" && !isOwnMeal && (meal?.available_portions || 0) > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs">
                    👫 {t("meal_detail.for_both")}
                  </Badge>
                  <span className="text-xs text-muted-foreground">2 {t("meal_detail.portions")}</span>
                </div>
                <Label className="text-sm font-semibold">{t("meal_detail.quantity")}</Label>
                <RadioGroup
                  value={bookingQuantity.toString()}
                  onValueChange={(val) => setBookingQuantity(parseInt(val))}
                  className="space-y-2"
                >
                  {/* Only show "For both" option if 2+ portions available */}
                  {(meal?.available_portions || 0) >= 2 && (
                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="2" id="couple-both" />
                      <Label htmlFor="couple-both" className="cursor-pointer flex-1">
                        👫 {t("meal_detail.for_both")}
                      </Label>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="1" id="couple-single" />
                    <Label htmlFor="couple-single" className="cursor-pointer flex-1">
                      👤 {t("meal_detail.for_me")}
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Aktionsbuttons - Sticky on Mobile */}
      <div className="fixed md:sticky bottom-16 md:bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border z-40">
        <div className="max-w-lg mx-auto flex gap-2">
          {/* Self-chat/booking block for own meal */}
          {isOwnMeal ? (
            <Button disabled variant="outline" className="flex-1">
              Dein eigenes Angebot
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  if (meal.id.startsWith('demo-')) {
                    toast.info(t("meal_detail.demo_chat_blocked"));
                    return;
                  }
                  if (!currentUser) {
                    setAuthModalOpen(true);
                  } else {
                    setChatOpen(true);
                  }
                }}
                className="flex-1"
                aria-label={t("meal_detail.chat_with_chef")}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                {t("meal_detail.chat_with_chef")}
              </Button>

              {bookingStatus === "none" && (
                <Button
                  onClick={handleRequestBooking}
                  disabled={meal.available_portions === 0 || bookingMutation.isPending}
                  className="flex-1"
                  aria-label={t("meal_detail.book_now")}
                >
                  {meal.available_portions === 0 ? t("meal_detail.sold_out") : t("meal_detail.book_now")}
                </Button>
              )}

              {bookingStatus === "pending" && (
                <>
                  {isWithinCancellationPeriod ? (
                    <Button
                      variant="destructive"
                      onClick={handleCancelBooking}
                      disabled={cancelBookingMutation.isPending}
                      className="flex-1"
                    >
                      {cancelBookingMutation.isPending ? t("common.loading") : t("meal_detail.cancel_booking")}
                    </Button>
                  ) : (
                    <Button disabled className="flex-1">
                      <Clock className="w-4 h-4 mr-2" />
                      {t("common.loading")}
                    </Button>
                  )}
                </>
              )}

              {bookingStatus === "confirmed" && (
                <div className="flex-1 space-y-2">
                  <Button disabled className="w-full bg-secondary">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {t("meal_detail.booking_confirmed")}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">{t("meal_detail.contact_chef_to_cancel")}</p>
                </div>
              )}
            </>
          )}

          {bookingStatus === "pending" && (
            <>
              {isWithinCancellationPeriod ? (
                <Button
                  variant="destructive"
                  onClick={handleCancelBooking}
                  disabled={cancelBookingMutation.isPending}
                  className="flex-1"
                >
                  {cancelBookingMutation.isPending ? t("common.loading") : t("meal_detail.cancel_booking")}
                </Button>
              ) : (
                <Button disabled className="flex-1">
                  <Clock className="w-4 h-4 mr-2" />
                  {t("common.loading")}
                </Button>
              )}
            </>
          )}

          {bookingStatus === "confirmed" && (
            <div className="flex-1 space-y-2">
              <Button disabled className="w-full bg-secondary">
                <CheckCircle className="w-4 h-4 mr-2" />
                {t("meal_detail.booking_confirmed")}
              </Button>
              <p className="text-xs text-center text-muted-foreground">{t("meal_detail.contact_chef_to_cancel")}</p>
            </div>
          )}
        </div>
      </div>

      <BottomNav />

      <ChatModal
        open={chatOpen}
        onOpenChange={setChatOpen}
        chefId={meal.chef_id}
        chefName={meal.chef?.first_name || "Chef"}
        mealId={meal.id}
        mealTitle={meal.title}
      />

      <ReportDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        reportedMealId={meal?.id}
        reportedUserId={meal?.chef_id}
      />

      <AuthInterstitialModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSignup={() => {
          setAuthModalOpen(false);
          navigate("/signup");
        }}
      />

      {currentUser && (
        <ProfileWizard
          open={profileWizardOpen}
          onClose={() => setProfileWizardOpen(false)}
          onComplete={handleProfileWizardComplete}
          userId={currentUser.id}
          {...getMissingProfileData()}
        />
      )}

      <Footer />
    </div>
  );
};

export default MealDetail;
