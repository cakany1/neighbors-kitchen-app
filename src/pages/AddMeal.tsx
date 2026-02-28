import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format, parse } from 'date-fns';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Shield, Plus, Minus, Calendar as CalendarIcon, Keyboard, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { exchangeOptions } from '@/utils/ingredientDatabase';
import { hashToConsistentOffset } from '@/utils/fuzzyLocation';
import { validateMealContent } from '@/utils/contentFilter';
import { validatePrice, parseLocalizedNumber, MIN_PRICE_CHF, MAX_PRICE_CHF, mapDbPriceError } from '@/utils/priceValidation';
import { TagSelector } from '@/components/meals/TagSelector';
import { AIImageGenerator } from '@/components/meals/AIImageGenerator';
import { generateAddressId } from '@/utils/addressHash';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const AddMeal = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Edit mode detection
  const editMealId = searchParams.get('edit');
  const isEditMode = !!editMealId;
  
  const [womenOnly, setWomenOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [visibilityRadius, setVisibilityRadius] = useState<number | null>(null); // null = no limit
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedExchangeOptions, setSelectedExchangeOptions] = useState<string[]>([]);
  const [useStockPhoto, setUseStockPhoto] = useState(false);
  const [barterText, setBarterText] = useState('');
  const [containerPolicy, setContainerPolicy] = useState<'bring_container' | 'plate_ok' | 'either_ok'>('either_ok');
  const [priceError, setPriceError] = useState<string | null>(null);
  
  // AI Image state
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);
  const [aiImageConfirmed, setAiImageConfirmed] = useState(false);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ingredients: '',
    restaurantReferencePrice: '',
    portions: '1',
    scheduledDate: new Date().toISOString().split('T')[0],
    collectionWindowStart: '',
    collectionWindowEnd: '',
  });

  // Time dropdown options (24h format)
  const DEFAULT_START_HOUR = '18';
  const DEFAULT_END_HOUR = '19';
  
  const hourOptions = Array.from({ length: 18 }, (_, i) => {
    const hour = (i + 6).toString().padStart(2, '0');
    return { value: hour, label: `${hour} ${t('add_meal.hour_suffix', 'Uhr')}` };
  }); // 06:00 - 23:00
  
  const minuteOptions = [
    { value: '00', label: ':00' },
    { value: '15', label: ':15' },
    { value: '30', label: ':30' },
    { value: '45', label: ':45' },
  ];

  // Address state for inline editing
  const [addressData, setAddressData] = useState({
    street: '',
    city: '',
    postalCode: '',
  });
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Fetch current user's profile - IMPORTANT: Use fresh query to avoid stale cache
  const { data: currentUser, refetch: refetchUser } = useQuery({
    queryKey: ['addMealUser'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('gender, avatar_url, private_address, private_city, private_postal_code, is_couple, verification_status, partner_verification_status, photo_verified, partner_photo_verified, visibility_mode')
        .eq('id', user.id)
        .single();
      
      // Check if couple is fully verified (for ID verification)
      const isCoupleFullyVerified = profile?.is_couple 
        ? (profile.verification_status === 'approved' && (profile as any).partner_verification_status === 'approved')
        : true; // Non-couples don't need partner verification
      
      // Check photo verification for women-only meals
      const isPhotoVerified = (profile as any)?.photo_verified || false;
      const isPartnerPhotoVerified = (profile as any)?.partner_photo_verified || false;
      
      // For women-only: both photos must be verified (if couple)
      const canOfferWomenOnly = profile?.is_couple 
        ? (isPhotoVerified && isPartnerPhotoVerified)
        : isPhotoVerified;
      
      return { 
        id: user.id, 
        gender: profile?.gender, 
        avatarUrl: profile?.avatar_url,
        hasAddress: !!(profile?.private_address && profile?.private_city),
        privateAddress: profile?.private_address || '',
        privateCity: profile?.private_city || '',
        privatePostalCode: profile?.private_postal_code || '',
        isCouple: profile?.is_couple || false,
        verificationStatus: profile?.verification_status || 'pending',
        partnerVerificationStatus: (profile as any)?.partner_verification_status || 'pending',
        isCoupleFullyVerified,
        photoVerified: isPhotoVerified,
        partnerPhotoVerified: isPartnerPhotoVerified,
        canOfferWomenOnly,
        visibilityMode: (profile as any)?.visibility_mode || 'all',
      };
    },
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: 'always',
  });

  // Fetch meal data when in edit mode
  const { data: editMeal } = useQuery({
    queryKey: ['editMeal', editMealId],
    queryFn: async () => {
      if (!editMealId || !currentUser?.id) return null;
      
      const { data: meal, error } = await supabase
        .from('meals')
        .select('*')
        .eq('id', editMealId)
        .eq('chef_id', currentUser.id) // Security: only owner can edit
        .single();
      
      if (error) throw error;
      
      // Check if within 5-minute edit window
      const ageMinutes = (Date.now() - new Date(meal.created_at).getTime()) / (1000 * 60);
      if (ageMinutes > 5) {
        toast.error(t('add_meal.edit_window_expired'));
        navigate(`/meal/${editMealId}`);
        return null;
      }
      
      return meal;
    },
    enabled: !!editMealId && !!currentUser?.id,
  });

  // Initialize address data when profile loads
  useEffect(() => {
    if (currentUser) {
      setAddressData({
        street: currentUser.privateAddress,
        city: currentUser.privateCity,
        postalCode: currentUser.privatePostalCode,
      });
      // Show form if no address exists
      if (!currentUser.hasAddress) {
        setShowAddressForm(true);
      }
    }
  }, [currentUser]);

  // Populate form when editing existing meal
  useEffect(() => {
    if (editMeal && isEditMode) {
      setFormData({
        title: editMeal.title || '',
        description: editMeal.description || '',
        ingredients: Array.isArray(editMeal.ingredients) ? editMeal.ingredients.join(', ') : (editMeal.ingredients || ''),
        restaurantReferencePrice: editMeal.restaurant_reference_price ? (editMeal.restaurant_reference_price / 100).toFixed(2) : '',
        portions: String(editMeal.available_portions || 1),
        scheduledDate: editMeal.scheduled_date ? new Date(editMeal.scheduled_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        collectionWindowStart: editMeal.collection_window_start || '',
        collectionWindowEnd: editMeal.collection_window_end || '',
      });
      
      setTags(editMeal.tags || []);
      setSelectedAllergens(editMeal.allergens || []);
      setWomenOnly(editMeal.women_only || false);
      setVisibilityRadius(editMeal.visibility_radius || null);
      setContainerPolicy((editMeal.container_policy as 'bring_container' | 'either_ok' | 'plate_ok') || 'either_ok');
      setBarterText(editMeal.barter_requests?.join(', ') || '');
      
      // Set exchange options
      const options: string[] = [];
      if (editMeal.restaurant_reference_price) options.push('online');
      if (editMeal.barter_requests?.length) options.push('barter');
      setSelectedExchangeOptions(options);
    }
  }, [editMeal, isEditMode]);

  const toggleExchangeOption = (option: string) => {
    setSelectedExchangeOptions(prev =>
      prev.includes(option) ? prev.filter(i => i !== option) : [...prev, option]
    );
  };

  // Smart Allergen Auto-Detection using canonical IDs
  const detectAllergens = (text: string) => {
    const lowerText = text.toLowerCase();
    const detectedAllergens: string[] = [];
    
    // Map German keywords to canonical allergen IDs
    const allergenKeywords: Record<string, string[]> = {
      'dairy': ['milch', 'sahne', 'käse', 'butter', 'joghurt', 'rahm', 'quark', 'schmand'],
      'eggs': ['ei', 'eier', 'spätzle'],
      'nuts': ['nuss', 'nüsse', 'mandel', 'walnuss', 'haselnuss', 'cashew', 'pistazie'],
      'peanuts': ['erdnuss', 'erdnüsse'],
      'gluten': ['mehl', 'weizen', 'brot', 'pasta', 'lasagne', 'teig', 'nudel', 'spaghetti'],
      'fish': ['fisch', 'thunfisch', 'lachs', 'forelle', 'sardine'],
      'soy': ['soja', 'tofu'],
      'mustard': ['senf'],
      'celery': ['sellerie'],
      'sesame': ['sesam'],
      'lupin': ['lupine', 'lupinen'],
      'molluscs': ['muschel', 'muscheln', 'schnecke', 'schnecken', 'tintenfisch'],
      'sulphites': ['sulfit', 'sulfite', 'schwefeldioxid'],
      'crustaceans': ['garnele', 'garnelen', 'krebs', 'hummer', 'shrimp', 'krabbe'],
    };

    Object.entries(allergenKeywords).forEach(([canonicalId, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        if (!detectedAllergens.includes(canonicalId)) {
          detectedAllergens.push(canonicalId);
        }
      }
    });

    if (detectedAllergens.length > 0) {
      setSelectedAllergens(prev => {
        const newAllergens = [...new Set([...prev, ...detectedAllergens])];
        return newAllergens;
      });
      // Translate detected allergens to display labels
      const allergenLabels = detectedAllergens.map(id => t(`canonical_labels.${id}`)).join(', ');
      toast.success(t('toast.allergens_detected', { allergens: allergenLabels }), {
        duration: 4000,
      });
    }
  };

  // Trigger allergen detection when title or description changes
  useEffect(() => {
    const textToScan = `${formData.title} ${formData.description}`.trim();
    if (textToScan.length > 3) {
      const timer = setTimeout(() => {
        detectAllergens(textToScan);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [formData.title, formData.description]);

  // Portion counter helpers
  const incrementPortions = () => {
    const current = parseInt(formData.portions) || 0;
    setFormData({ ...formData, portions: (current + 1).toString() });
  };

  const decrementPortions = () => {
    const current = parseInt(formData.portions) || 0;
    if (current > 1) {
      setFormData({ ...formData, portions: (current - 1).toString() });
    }
  };

  // Helper function to check if a time slot is in the past
  const isTimeInPast = (timeString: string): boolean => {
    if (!formData.scheduledDate || !timeString) return false;
    
    const now = new Date();
    const scheduledDate = new Date(formData.scheduledDate);
    
    // Compare dates in local timezone by comparing year, month, and day
    const isToday = scheduledDate.getFullYear() === now.getFullYear() &&
                    scheduledDate.getMonth() === now.getMonth() &&
                    scheduledDate.getDate() === now.getDate();
    
    if (!isToday) return false; // Future dates are always valid
    
    const [hour, minute] = timeString.split(':').map(Number);
    // Create pickup time in local timezone using date components
    const pickupTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hour,
      minute,
      0,
      0
    );
    
    // Add 15 min grace period
    const graceTime = new Date(now.getTime() + 15 * 60 * 1000);
    
    return pickupTime < graceTime;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // AUTH GATEKEEPER: Redirect to signup if not authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/signup');
      return;
    }
    
    // MVP: Profile photo is OPTIONAL for standard meals
    // Only require avatar for verified-only meals (future feature)
    
    // WOMEN-ONLY PHOTO VERIFICATION CHECK
    // Block at frontend level for better UX (DB trigger also enforces this)
    if (currentUser?.visibilityMode === 'women_only' && !currentUser?.canOfferWomenOnly) {
      toast.error(t('profile.women_only_photo_verification_required'));
      return;
    }
    
    // CONTENT FILTER: Use centralized filter with normalization
    const contentCheck = validateMealContent(formData.title, formData.description);
    if (!contentCheck.isValid) {
      toast.error(contentCheck.error || t('add_meal.respectful_language_error', 'Bitte respektvolle Sprache verwenden.'));
      return;
    }
    
    // Validation
    if (!formData.title || !formData.scheduledDate) {
      toast.error(t('toast.fill_required_fields'));
      return;
    }

    if (!formData.collectionWindowStart) {
      toast.error(t('toast.set_collection_window'));
      return;
    }

    // TIME VALIDATION: Block past pickup slots for today
    const now = new Date();
    const scheduledDate = new Date(formData.scheduledDate);
    const isToday = scheduledDate.toDateString() === now.toDateString();
    
    if (isToday && formData.collectionWindowStart) {
      const [hour, minute] = formData.collectionWindowStart.split(':').map(Number);
      const pickupTime = new Date(scheduledDate);
      pickupTime.setHours(hour, minute, 0, 0);
      
      // Add 15 min grace period
      const graceTime = new Date(now.getTime() + 15 * 60 * 1000);
      
      if (pickupTime < graceTime) {
        toast.error(t('add_meal.past_timeslot_error', 'Dieser Zeitslot liegt in der Vergangenheit. Bitte wähle einen späteren Zeitpunkt.'));
        return;
      }
    }

    if (selectedExchangeOptions.length === 0) {
      toast.error(t('toast.select_exchange_option'));
      return;
    }

    // AI Image confirmation check
    if (isAiGenerated && !aiImageConfirmed) {
      toast.error(t('add_meal.ai_confirm_required', 'Bitte bestätige, dass das KI-Bild dein Gericht repräsentiert.'));
      return;
    }

    // Validate price using localized validation
    const isMoneyMode = selectedExchangeOptions.includes('online');
    const priceValidation = validatePrice(formData.restaurantReferencePrice, t, isMoneyMode);
    
    if (!priceValidation.isValid) {
      toast.error(priceValidation.error);
      setPriceError(priceValidation.error || null);
      return;
    }
    
    const priceCents = formData.restaurantReferencePrice 
      ? Math.round(parseLocalizedNumber(formData.restaurantReferencePrice) * 100) 
      : 0;

    try {
      // Validate address data
      if (!addressData.street.trim() || !addressData.city.trim()) {
        toast.error(t('add_meal.address_required'));
        setShowAddressForm(true);
        return;
      }

      // Show loading state
      const loadingToastId = toast.loading(t('add_meal.creating_meal_toast', 'Gericht wird erstellt und übersetzt...'));

      // Save address to profile if it's new or changed
      const addressId = generateAddressId(addressData.street, addressData.city, addressData.postalCode);
      
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          private_address: addressData.street.trim(),
          private_city: addressData.city.trim(),
          private_postal_code: addressData.postalCode.trim() || null,
          address_id: addressId,
        })
        .eq('id', user.id);

      if (profileUpdateError) {
        console.error('Profile update error:', profileUpdateError);
        toast.dismiss(loadingToastId);
        toast.error(t('toast.address_save_failed'));
        return;
      }

      // Get visibility_mode from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('visibility_mode')
        .eq('id', user.id)
        .single();

      // 1. Geocode chef's exact address
      console.log('[AddMeal] Geocoding address:', addressData);
      
      let geoData = null;
      let geoError = null;
      
      try {
        const response = await supabase.functions.invoke('geocode-address', {
          body: {
            street: addressData.street.trim(),
            city: addressData.city.trim(),
            postalCode: addressData.postalCode.trim() || ''
          }
        });
        geoData = response.data;
        geoError = response.error;
      } catch (invokeError) {
        console.error('[AddMeal] Geocoding invoke error:', invokeError);
        geoError = invokeError;
      }

      // Handle geocoding errors gracefully
      if (geoError) {
        console.error('[AddMeal] Geocoding error:', geoError);
        toast.dismiss(loadingToastId);
        // Check for rate limit error
        if (geoError.message?.includes('Rate limit') || geoError.status === 429) {
          toast.error(t('add_meal.geocoding_rate_limit'));
        } else {
          toast.error(t('add_meal.address_not_resolved'));
        }
        return;
      }

      // Check for valid coordinates - the API returns latitude/longitude as numbers
      // It returns null values if the address was not found (404 response)
      if (!geoData || typeof geoData.latitude !== 'number' || typeof geoData.longitude !== 'number') {
        console.error('[AddMeal] Invalid geocoding response:', geoData);
        toast.dismiss(loadingToastId);
        toast.error(t('add_meal.address_not_resolved'));
        return;
      }
      
      console.log('[AddMeal] Geocoded successfully:', { lat: geoData.latitude, lng: geoData.longitude });

      // 2. Add CONSISTENT hash-based offset for fuzzy location (±300m ≈ ±0.003 degrees)
      // Using hash of user address ensures same offset for all meals from same location
      // This prevents triangulation attacks where averaging multiple fuzzy coords reveals true location
      const addressHash = hashToConsistentOffset(`${addressData.street.trim()}-${addressData.city.trim()}-${user.id}`);
      const fuzzyLat = geoData.latitude + addressHash.latOffset;
      const fuzzyLng = geoData.longitude + addressHash.lngOffset;

      // 3. Combine scheduled date and collection start time
      const scheduledDateTime = `${formData.scheduledDate}T${formData.collectionWindowStart || '18:00'}:00`;

      // 4. Prepare meal data
      const baseDescription = formData.description.trim() || formData.title.trim();
      const finalDescription = selectedExchangeOptions.includes('barter') && barterText.trim()
        ? `Gegenleistung: ${barterText.trim()}\n\n${baseDescription}`
        : baseDescription;

      // 4.5. Translate title and description to English
      let titleEn = null;
      let descriptionEn = null;
      
      try {
        console.log('Translating meal content to English...');
        
        // Translate title
        const { data: titleTranslation } = await supabase.functions.invoke('translate-message', {
          body: {
            text: formData.title.trim(),
            sourceLanguage: 'German',
            targetLanguage: 'English'
          }
        });
        
        // Translate description
        const { data: descTranslation } = await supabase.functions.invoke('translate-message', {
          body: {
            text: finalDescription,
            sourceLanguage: 'German',
            targetLanguage: 'English'
          }
        });
        
        if (titleTranslation?.translatedText) {
          titleEn = titleTranslation.translatedText;
        }
        
        if (descTranslation?.translatedText) {
          descriptionEn = descTranslation.translatedText;
        }
        
        console.log('Translation successful:', { titleEn, descriptionEn });
      } catch (translationError) {
        console.error('Translation failed, continuing without English version:', translationError);
        // Continue without translations if they fail
      }

      const mealData = {
        chef_id: user.id,
        title: formData.title.trim(),
        title_en: titleEn,
        description: finalDescription,
        description_en: descriptionEn,
        fuzzy_lat: fuzzyLat,
        fuzzy_lng: fuzzyLng,
        exact_address: `${addressData.street.trim()}, ${addressData.city.trim()}`,
        neighborhood: addressData.city.trim(),
        scheduled_date: scheduledDateTime,
        collection_window_start: formData.collectionWindowStart,
        collection_window_end: formData.collectionWindowEnd || formData.collectionWindowStart,
        available_portions: parseInt(formData.portions) || 1,
        women_only: womenOnly,
        visibility_mode: profile.visibility_mode || 'all',
        visibility_radius: visibilityRadius,
        exchange_mode: selectedExchangeOptions.includes('online') ? 'money' : 'barter',
        pricing_minimum: selectedExchangeOptions.includes('online') ? priceCents : 0,
        pricing_suggested: selectedExchangeOptions.includes('online') ? priceCents : null,
        restaurant_reference_price: selectedExchangeOptions.includes('online') ? priceCents : null,
        address_id: addressId,
        allergens: selectedAllergens.length > 0 ? selectedAllergens : null,
        tags: tags.length > 0 ? tags : null,
        is_stock_photo: useStockPhoto && !isAiGenerated,
        handover_mode: 'pickup_box',
        unit_type: 'portions',
        is_cooking_experience: false,
        container_policy: containerPolicy,
        // AI Image fields
        image_url: aiImageUrl || null,
        is_ai_generated: isAiGenerated,
        ai_image_confirmed: aiImageConfirmed,
      };

      // 5. Insert or Update meal in database
      let mealId: string;
      if (isEditMode && editMealId) {
        // Update existing meal
        const { data: updatedMeal, error: updateError } = await supabase
          .from('meals')
          .update(mealData)
          .eq('id', editMealId)
          .eq('chef_id', user.id) // Security: verify ownership
          .select()
          .single();

        if (updateError) {
          console.error('Update error:', updateError);
          toast.dismiss(loadingToastId);
          const friendlyError = mapDbPriceError(updateError.message || '', t);
          toast.error(friendlyError || t('toast.meal_update_error'));
          return;
        }
        
        mealId = updatedMeal.id;
        toast.dismiss(loadingToastId);
        toast.success(t('toast.meal_updated'));
      } else {
        // Insert new meal
        const { data: newMeal, error: insertError } = await supabase
          .from('meals')
          .insert(mealData)
          .select()
          .single();

        if (insertError) {
          console.error('Insert error:', insertError);
          toast.dismiss(loadingToastId);
          // Map database constraint errors to localized messages
          const friendlyError = mapDbPriceError(insertError.message || '', t);
          toast.error(friendlyError || t('toast.meal_creation_error'));
          return;
        }

        mealId = newMeal.id;
        toast.dismiss(loadingToastId);
        toast.success(t('toast.meal_live'));
      }
      
      // Navigate to the meal detail page
      setTimeout(() => {
        navigate(`/meal/${mealId}`);
      }, 1000);

    } catch (error) {
      console.error('Error creating meal:', error);
      toast.dismiss();
      toast.error(t('toast.general_error'));
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {isEditMode ? t('add_meal.edit_page_title') : t('add_meal.page_title')}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode ? t('add_meal.edit_page_subtitle') : t('add_meal.page_subtitle')}
          </p>
        </div>

        {/* Couple Verification Info — informational only, does NOT block meal creation */}
        {currentUser?.isCouple && !currentUser?.isCoupleFullyVerified && (
          <Alert className="mb-6 border-amber-500/50 bg-amber-500/5">
            <Shield className="h-5 w-5 text-amber-500" />
            <AlertDescription className="space-y-3">
              <div>
                <strong className="text-amber-600 dark:text-amber-400">{t('add_meal.couple_verification_info', 'Hinweis zur Paar-Verifizierung')}</strong>
                <p className="text-sm mt-1">{t('add_meal.couple_verification_info_desc', 'Für bestimmte Funktionen (z.B. Women-Only Gerichte) müssen beide Partner verifiziert sein.')}</p>
              </div>
              <div className="flex flex-col gap-2 text-sm">
                {currentUser.verificationStatus !== 'approved' && (
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500">⏳</span>
                    <span>{t('add_meal.your_verification_missing')}</span>
                  </div>
                )}
                {currentUser.verificationStatus === 'approved' && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✅</span>
                    <span>{t('add_meal.your_verification_done')}</span>
                  </div>
                )}
                {currentUser.partnerVerificationStatus !== 'approved' && (
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500">⏳</span>
                    <span>{t('add_meal.partner_verification_missing')}</span>
                  </div>
                )}
                {currentUser.partnerVerificationStatus === 'approved' && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✅</span>
                    <span>{t('add_meal.partner_verification_done')}</span>
                  </div>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="w-full border-amber-500/50 hover:bg-amber-500/10"
                onClick={() => navigate('/profile')}
              >
                {t('add_meal.go_to_verification')}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Women-Only Photo Verification Block - Only when visibility is women_only */}
        {currentUser?.visibilityMode === 'women_only' && !currentUser?.canOfferWomenOnly && (
          <Alert className="mb-6 border-pink-500 bg-pink-500/10">
            <Shield className="h-5 w-5 text-pink-500" />
            <AlertDescription className="space-y-3">
              <div>
                <strong className="text-pink-600 dark:text-pink-400">{t('add_meal.women_only_photo_blocked')}</strong>
                <p className="text-sm mt-1">{t('add_meal.women_only_photo_blocked_desc')}</p>
              </div>
              <div className="flex flex-col gap-2 text-sm">
                {!currentUser.photoVerified && (
                  <div className="flex items-center gap-2">
                    <span className="text-destructive">❌</span>
                    <span>{t('add_meal.your_photo_not_verified_msg')}</span>
                  </div>
                )}
                {currentUser.photoVerified && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✅</span>
                    <span>{t('add_meal.your_photo_verified_msg')}</span>
                  </div>
                )}
                {currentUser.isCouple && !currentUser.partnerPhotoVerified && (
                  <div className="flex items-center gap-2">
                    <span className="text-destructive">❌</span>
                    <span>{t('add_meal.partner_photo_not_verified_msg')}</span>
                  </div>
                )}
                {currentUser.isCouple && currentUser.partnerPhotoVerified && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✅</span>
                    <span>{t('add_meal.partner_photo_verified_msg')}</span>
                  </div>
                )}
              </div>
              <Button 
                variant="outline" 
                className="w-full border-pink-500 hover:bg-pink-500/20"
                onClick={() => navigate('/profile')}
              >
                {t('add_meal.go_to_verification')}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title & Description */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label htmlFor="title" className="text-lg font-semibold">
                  {t('add_meal.whats_cooking')}
                </Label>
                <Input
                  id="title"
                  placeholder={t('add_meal.title_placeholder')}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="text-base h-12"
                  required
                />
              </div>

              {/* Description - Moved from accordion */}
              <div>
                <Label htmlFor="description" className="text-base font-medium">
                  {t('add_meal.description_label')}
                </Label>
                <Textarea
                  id="description"
                  placeholder={t('add_meal.description_placeholder')}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="mt-2"
                />
              </div>
              {/* AI Image Preview - Directly below description */}
              <div className="p-4 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    {t('add_meal.ai_preview_title', 'KI-Vorschaubild')}
                  </span>
                </div>
                {!aiImageUrl && !isAiGenerated ? (
                  <p className="text-xs text-muted-foreground mb-3">
                    {t('add_meal.ai_preview_placeholder', 'Vorschau erscheint hier, sobald du ein Bild generierst.')}
                  </p>
                ) : null}
                <AIImageGenerator
                  title={formData.title}
                  description={formData.description}
                  ingredients={formData.ingredients}
                  onImageGenerated={(url) => {
                    setAiImageUrl(url);
                    setIsAiGenerated(true);
                    setUseStockPhoto(false);
                  }}
                  onConfirmationChange={setAiImageConfirmed}
                  isConfirmed={aiImageConfirmed}
                  currentImageUrl={aiImageUrl || undefined}
                  isAIImage={isAiGenerated}
                />
              </div>
            </CardContent>
          </Card>

          {/* Portions Counter */}
          <Card>
            <CardContent className="pt-6">
              <Label className="text-lg font-semibold mb-3 block">{t('add_meal.portions_label')} *</Label>
              <div className="flex items-center justify-center gap-6">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={decrementPortions}
                  disabled={parseInt(formData.portions) <= 1}
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <div className="text-4xl font-bold text-primary min-w-[80px] text-center">
                  {formData.portions || '1'}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={incrementPortions}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Card - Date & Time */}
          <Card className="bg-muted/30">
            <CardContent className="pt-6 space-y-5">
              {/* Date Picker with Quick Buttons */}
              <div>
                <Label className="text-lg font-semibold flex items-center gap-2 mb-3">
                  <CalendarIcon className="w-5 h-5" />
                  {t('add_meal.ready_from')} *
                </Label>
                
                {/* Quick Date Buttons */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <Button
                    type="button"
                    variant={formData.scheduledDate === new Date().toISOString().split('T')[0] ? 'default' : 'outline'}
                    onClick={() => {
                      const today = new Date().toISOString().split('T')[0];
                      setFormData({ ...formData, scheduledDate: today });
                    }}
                  >
                    {t('add_meal.today')}
                  </Button>
                  <Button
                    type="button"
                    variant={formData.scheduledDate === new Date(Date.now() + 86400000).toISOString().split('T')[0] ? 'default' : 'outline'}
                    onClick={() => {
                      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
                      setFormData({ ...formData, scheduledDate: tomorrow });
                    }}
                  >
                    {t('add_meal.tomorrow')}
                  </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const dateInput = document.createElement('input');
                    dateInput.type = 'date';
                    dateInput.value = formData.scheduledDate;
                    dateInput.min = new Date().toISOString().split('T')[0];
                    dateInput.onchange = (e) => {
                      const target = e.target as HTMLInputElement;
                      if (target.value && target.value >= new Date().toISOString().split('T')[0]) {
                        setFormData({ ...formData, scheduledDate: target.value });
                      }
                    };
                    dateInput.showPicker?.();
                    dateInput.click();
                  }}
                >
                  <CalendarIcon className="w-4 h-4" />
                </Button>
                </div>
                
                {/* Date Input - DD.MM.YYYY Format */}
                <Input
                  id="scheduledDate"
                  type="text"
                  placeholder="TT.MM.JJJJ"
                  value={formData.scheduledDate ? format(parse(formData.scheduledDate, 'yyyy-MM-dd', new Date()), 'dd.MM.yyyy') : ''}
                  onChange={(e) => {
                    const input = e.target.value;
                    // Allow only numbers and dots
                    if (!/^[\d.]*$/.test(input)) return;
                    
                    // Try to parse DD.MM.YYYY format
                    if (input.length === 10) {
                      try {
                        const parsedDate = parse(input, 'dd.MM.yyyy', new Date());
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        if (!isNaN(parsedDate.getTime()) && parsedDate >= today) {
                          const isoDate = format(parsedDate, 'yyyy-MM-dd');
                          setFormData({ ...formData, scheduledDate: isoDate });
                        }
                      } catch {
                        // Invalid date format
                      }
                    }
                  }}
                  required
                  className="h-11 font-mono"
                  maxLength={10}
                />
                
                {/* Full German Date Display */}
                {formData.scheduledDate && (
                  <p className="text-sm font-medium text-primary mt-2">
                    {new Date(formData.scheduledDate + 'T00:00:00').toLocaleDateString('de-DE', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* Time Selection */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold block">{t('add_meal.pickup_time')} *</Label>
                <p className="text-sm text-muted-foreground">{t('add_meal.pickup_time_hint')}</p>
                
                {/* Smart Time Chips */}
                <div className="grid grid-cols-2 gap-3">
                  {['17:00', '18:00', '19:00', '20:00'].map((time) => {
                    const isPast = isTimeInPast(time);
                    return (
                      <Button
                        key={time}
                        type="button"
                        variant={formData.collectionWindowStart === time ? 'default' : 'outline'}
                        onClick={() => {
                          if (isPast) {
                            toast.error(t('add_meal.past_timeslot_error', 'Dieser Zeitslot liegt in der Vergangenheit. Bitte wähle einen späteren Zeitpunkt.'));
                            return;
                          }
                          const endHour = (parseInt(time.split(':')[0]) + 1).toString().padStart(2, '0');
                          setFormData({ 
                            ...formData, 
                            collectionWindowStart: time,
                            collectionWindowEnd: `${endHour}:00`
                          });
                        }}
                        disabled={isPast}
                        className="h-12"
                      >
                        {`${time} - ${(parseInt(time.split(':')[0]) + 1).toString().padStart(2, '0')}:00 ${t('add_meal.time_suffix', 'Uhr')}`}
                      </Button>
                    );
                  })}
                </div>

                {/* Manual Time Selection with Dropdowns */}
                <div className="pt-2">
                  <Label className="text-sm text-muted-foreground mb-3 block">Oder wähle eine individuelle Zeit:</Label>
                  
                  {/* Start Time - Compact Layout */}
                  <div className="mb-4">
                    <Label className="text-xs text-muted-foreground mb-2 block">Von</Label>
                    <div className="flex items-center gap-1">
                      <Select
                        value={formData.collectionWindowStart.split(':')[0] || ''}
                        onValueChange={(hour) => {
                          const minute = formData.collectionWindowStart.split(':')[1] || '00';
                          const newTime = `${hour}:${minute}`;
                          if (isTimeInPast(newTime)) {
                            toast.error(t('add_meal.past_timeslot_error', 'Dieser Zeitslot liegt in der Vergangenheit. Bitte wähle einen späteren Zeitpunkt.'));
                            return;
                          }
                          setFormData({ ...formData, collectionWindowStart: newTime });
                        }}
                      >
                        <SelectTrigger className="h-11 w-[90px]">
                          <SelectValue placeholder="HH" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {hourOptions.map((opt) => {
                            // Only disable if all minute options (including :45) would be in the past
                            const isPastHour = isTimeInPast(`${opt.value}:45`);
                            return (
                              <SelectItem key={opt.value} value={opt.value} disabled={isPastHour}>
                                {opt.value}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <span className="text-lg font-bold px-1">:</span>
                      <Select
                        value={formData.collectionWindowStart.split(':')[1] || ''}
                        onValueChange={(minute) => {
                          const hour = formData.collectionWindowStart.split(':')[0] || DEFAULT_START_HOUR;
                          const newTime = `${hour}:${minute}`;
                          if (isTimeInPast(newTime)) {
                            toast.error(t('add_meal.past_timeslot_error', 'Dieser Zeitslot liegt in der Vergangenheit. Bitte wähle einen späteren Zeitpunkt.'));
                            return;
                          }
                          setFormData({ ...formData, collectionWindowStart: newTime });
                        }}
                      >
                        <SelectTrigger className="h-11 w-[90px]">
                          <SelectValue placeholder="MM" />
                        </SelectTrigger>
                        <SelectContent>
                          {minuteOptions.map((opt) => {
                            const hour = formData.collectionWindowStart.split(':')[0] || DEFAULT_START_HOUR;
                            const isPastMinute = isTimeInPast(`${hour}:${opt.value}`);
                            return (
                              <SelectItem key={opt.value} value={opt.value} disabled={isPastMinute}>
                                {opt.value}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <span className="ml-1 text-sm text-muted-foreground">{t('add_meal.time_suffix', 'Uhr')}</span>
                    </div>
                  </div>

                  {/* End Time - Compact Layout */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Bis</Label>
                    <div className="flex items-center gap-1">
                      <Select
                        value={formData.collectionWindowEnd.split(':')[0] || ''}
                        onValueChange={(hour) => {
                          const minute = formData.collectionWindowEnd.split(':')[1] || '00';
                          const newTime = `${hour}:${minute}`;
                          if (isTimeInPast(newTime)) {
                            toast.error(t('add_meal.past_timeslot_error', 'Dieser Zeitslot liegt in der Vergangenheit. Bitte wähle einen späteren Zeitpunkt.'));
                            return;
                          }
                          setFormData({ ...formData, collectionWindowEnd: newTime });
                        }}
                      >
                        <SelectTrigger className="h-11 w-[90px]">
                          <SelectValue placeholder="HH" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {hourOptions.map((opt) => {
                            // Only disable if all minute options (including :45) would be in the past
                            const isPastHour = isTimeInPast(`${opt.value}:45`);
                            return (
                              <SelectItem key={opt.value} value={opt.value} disabled={isPastHour}>
                                {opt.value}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <span className="text-lg font-bold px-1">:</span>
                      <Select
                        value={formData.collectionWindowEnd.split(':')[1] || ''}
                        onValueChange={(minute) => {
                          const hour = formData.collectionWindowEnd.split(':')[0] || DEFAULT_END_HOUR;
                          const newTime = `${hour}:${minute}`;
                          if (isTimeInPast(newTime)) {
                            toast.error(t('add_meal.past_timeslot_error', 'Dieser Zeitslot liegt in der Vergangenheit. Bitte wähle einen späteren Zeitpunkt.'));
                            return;
                          }
                          setFormData({ ...formData, collectionWindowEnd: newTime });
                        }}
                      >
                        <SelectTrigger className="h-11 w-[90px]">
                          <SelectValue placeholder="MM" />
                        </SelectTrigger>
                        <SelectContent>
                          {minuteOptions.map((opt) => {
                            const hour = formData.collectionWindowEnd.split(':')[0] || DEFAULT_END_HOUR;
                            const isPastMinute = isTimeInPast(`${hour}:${opt.value}`);
                            return (
                              <SelectItem key={opt.value} value={opt.value} disabled={isPastMinute}>
                                {opt.value}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <span className="ml-1 text-sm text-muted-foreground">{t('add_meal.time_suffix', 'Uhr')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pickup Address Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                📍 {t('add_meal.pickup_address')} *
              </CardTitle>
              <CardDescription>
                {t('add_meal.pickup_address_hint')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Show current address or prompt to add */}
              {currentUser?.hasAddress && !showAddressForm ? (
                <div className="space-y-3">
                  <div className="p-3 bg-muted/50 rounded-lg border">
                    <p className="font-medium">{addressData.street}</p>
                    <p className="text-sm text-muted-foreground">
                      {addressData.postalCode} {addressData.city}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddressForm(true)}
                  >
                    {t('add_meal.change_address')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="street">{t('profile.street')} *</Label>
                    <Input
                      id="street"
                      placeholder={t('profile.street_placeholder')}
                      value={addressData.street}
                      onChange={(e) => setAddressData({ ...addressData, street: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="postalCode">{t('profile.postal_code')}</Label>
                      <Input
                        id="postalCode"
                        placeholder="4051"
                        value={addressData.postalCode}
                        onChange={(e) => setAddressData({ ...addressData, postalCode: e.target.value })}
                        maxLength={5}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="city">{t('profile.city')} *</Label>
                      <Input
                        id="city"
                        placeholder="Basel"
                        value={addressData.city}
                        onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  {currentUser?.hasAddress && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowAddressForm(false);
                        setAddressData({
                          street: currentUser.privateAddress,
                          city: currentUser.privateCity,
                          postalCode: currentUser.privatePostalCode,
                        });
                      }}
                    >
                      {t('common.cancel')}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Exchange Options */}
          <Card>
            <CardHeader>
              <CardTitle>{t('add_meal.exchange_title')} *</CardTitle>
              <CardDescription>{t('add_meal.exchange_desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {exchangeOptions.map((option) => {
                  const isBarter = option.value === 'barter';
                  const isOnline = option.value === 'online';
                  const isSelected = selectedExchangeOptions.includes(option.value);
                  return (
                    <div
                      key={option.value}
                      className="flex flex-col space-y-2 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id={`exchange-${option.value}`}
                          checked={isSelected}
                          onCheckedChange={() => toggleExchangeOption(option.value)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <Label
                            htmlFor={`exchange-${option.value}`}
                            className="text-sm font-normal cursor-pointer flex items-center gap-2"
                          >
                            {option.icon && <span className="text-lg">{option.icon}</span>}
                            <span>{option.label}</span>
                          </Label>
                          {option.note && (
                            <p className="text-xs text-muted-foreground mt-1 ml-6">{option.note}</p>
                          )}
                        </div>
                      </div>

                      {isBarter && isSelected && (
                        <div className="pl-8 w-full">
                          <Input
                            value={barterText}
                            onChange={(e) => setBarterText(e.target.value)}
                            placeholder="z.B. Eine Zwiebel, Schokolade, oder 'Überrasch mich'..."
                            className="h-10 text-sm"
                          />
                        </div>
                      )}

                      {isOnline && isSelected && (
                        <div className="pl-8 w-full space-y-3">
                          <Label htmlFor="price" className="text-sm font-medium">
                            {t('add_meal.price_label')} <span className="text-destructive">*</span>
                          </Label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                              <span className="text-muted-foreground font-medium">CHF</span>
                            </div>
                            <Input
                              id="price"
                              type="text"
                              inputMode="decimal"
                              value={formData.restaurantReferencePrice}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFormData({ ...formData, restaurantReferencePrice: val });
                                // Real-time validation
                                const validation = validatePrice(val, t, true);
                                setPriceError(validation.isValid ? null : validation.error || null);
                              }}
                              onBlur={() => {
                                // Validate on blur
                                const validation = validatePrice(formData.restaurantReferencePrice, t, true);
                                setPriceError(validation.isValid ? null : validation.error || null);
                              }}
                              placeholder="12.00"
                              className={`pl-14 h-12 text-lg font-semibold text-right pr-4 ${priceError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                            />
                          </div>
                          {priceError && (
                            <p className="text-sm text-destructive font-medium">
                              ⚠️ {priceError}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {t('add_meal.price_hint')}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Container Policy for Pickup */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🥡 Behälter für Abholung</CardTitle>
              <CardDescription>
                Was sollen Gäste zur Abholung mitbringen?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={containerPolicy}
                onValueChange={(val) => setContainerPolicy(val as 'bring_container' | 'plate_ok' | 'either_ok')}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bring_container">{t('add_meal.bring_container_option', '📦 Bitte Tupperware mitbringen')}</SelectItem>
                  <SelectItem value="plate_ok">🍽️ Teller genügt</SelectItem>
                  <SelectItem value="either_ok">🤷 Egal / Alles OK</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* NEW: Audience & Safety Section */}
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                {t('add_meal.who_can_pickup')}
              </CardTitle>
              <CardDescription>
                {t('add_meal.restrictions_note')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Visibility Radius - Chef-side distance limit */}
              <div className="p-3 rounded-lg border border-border">
                <Label className="text-sm font-medium mb-2 block">
                  📍 {t('add_meal.visibility_radius_label')}
                </Label>
                <p className="text-xs text-muted-foreground mb-3">
                  {t('add_meal.visibility_radius_hint')}
                </p>
                <Select
                  value={visibilityRadius?.toString() || 'all'}
                  onValueChange={(val) => setVisibilityRadius(val === 'all' ? null : parseInt(val))}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">🌍 {t('add_meal.radius_all')}</SelectItem>
                    <SelectItem value="100">🏠 {t('add_meal.radius_100m')}</SelectItem>
                    <SelectItem value="500">🏘️ {t('add_meal.radius_500m')}</SelectItem>
                    <SelectItem value="1000">📍 {t('add_meal.radius_1km')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Verified Only Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-primary" />
                  <div>
                    <Label htmlFor="verified-only" className="text-sm font-medium cursor-pointer">
                      ✓ {t('add_meal.verified_only')}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t('add_meal.verified_only_desc')}
                    </p>
                  </div>
                </div>
                <Switch
                  id="verified-only"
                  checked={verifiedOnly}
                  onCheckedChange={setVerifiedOnly}
                />
              </div>

              {/* Ladies Only Toggle - Conditional */}
              {currentUser?.gender === 'female' && (
                <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-destructive" />
                    <div>
                      <Label htmlFor="women-only" className="text-sm font-medium cursor-pointer">
                        👩 {t('add_meal.ladies_only')}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {t('add_meal.ladies_only_desc')}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="women-only"
                    checked={womenOnly}
                    onCheckedChange={setWomenOnly}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Optional Details - Collapsible */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="details" className="border-none">
              <Card>
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    📸 Foto &amp; Details hinzufügen (Optional)
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="space-y-6 pt-2">
                    {/* Photo Options - Upload only (AI preview moved above) */}
                     <div className="space-y-4">
                       <Label className="block font-medium">{t('add_meal.photo_label', 'Foto vom Gericht')}</Label>

                       {/* Traditional Photo Upload */}
                       {!isAiGenerated && (
                         <>
                           <Button 
                             type="button" 
                             variant="outline" 
                             className="w-full h-14 flex items-center justify-center gap-2"
                           >
                             <Upload className="w-5 h-5" />
                             <span>{t('add_meal.upload_photo', 'Echtes Foto hochladen')}</span>
                           </Button>
                           <Button 
                             type="button" 
                             variant="ghost" 
                             size="sm" 
                             onClick={() => setUseStockPhoto(true)}
                             className="w-full"
                           >
                             {t('add_meal.use_stock_photo', 'Symbolbild verwenden')}
                           </Button>
                         </>
                       )}

                       {/* Stock Photo Selected */}
                       {useStockPhoto && !isAiGenerated && (
                         <Alert>
                           <AlertDescription>
                             📷 {t('add_meal.stock_photo_notice', 'Ein Symbolbild wird mit dem Badge "Symbolbild" angezeigt')}
                           </AlertDescription>
                         </Alert>
                       )}

                       {/* Reset AI Image */}
                       {isAiGenerated && (
                         <Button
                           type="button"
                           variant="ghost"
                           size="sm"
                           onClick={() => {
                             setAiImageUrl(null);
                             setIsAiGenerated(false);
                             setAiImageConfirmed(false);
                           }}
                           className="w-full text-muted-foreground"
                         >
                           {t('add_meal.remove_ai_image', 'KI-Bild entfernen')}
                         </Button>
                       )}
                     </div>

                    {/* Allergens & Tags */}
                    <TagSelector
                      selectedAllergens={selectedAllergens}
                      onAllergensChange={setSelectedAllergens}
                      selectedTags={tags}
                      onTagsChange={setTags}
                      ingredientText={formData.ingredients}
                      titleText={formData.title}
                      descriptionText={formData.description}
                    />

                    {/* Restaurant Reference Price */}
                    {selectedExchangeOptions.includes('online') && (
                      <div className="space-y-4 pt-2 border-t border-border">
                        <div>
                          <Label htmlFor="restaurantReferencePrice">Restaurant-Referenzpreis (CHF)</Label>
                          <Input
                            id="restaurantReferencePrice"
                            type="number"
                            min="7.00"
                            max="50.00"
                            step="0.50"
                            placeholder="z.B. 24"
                            value={formData.restaurantReferencePrice}
                            onChange={(e) => setFormData({ ...formData, restaurantReferencePrice: e.target.value })}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Mindestpreis: CHF 7.00 • Maximaler Preis: CHF 50.00
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            (Der Mindestbetrag von CHF 7.00 beinhaltet die CHF 2.00 Servicegebühr für den Betrieb der Plattform.)
                          </p>
                          {parseFloat(formData.restaurantReferencePrice) > 50 && (
                            <p className="text-xs text-destructive mt-1">
                              ⚠️ Für Beträge über CHF 50.- (Catering) kontaktiere uns bitte direkt.
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          </Accordion>

          {/* Keyboard Dismiss Button - Fixed on mobile when input is focused */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="fixed bottom-24 right-4 z-50 md:hidden shadow-lg bg-background border-2"
            onClick={() => {
              // Blur active element to dismiss keyboard
              if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
              }
            }}
          >
            <Keyboard className="h-4 w-4 mr-1" />
            Fertig
          </Button>

          {/* Pre-Publish Info — single clean block */}
          <Alert className="border-muted bg-muted/30">
            <AlertDescription className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">💡 {t('add_meal.gentleman_notice_title')}</span>
              <br />
              {t('add_meal.gentleman_notice_text')}
            </AlertDescription>
          </Alert>

          {/* Submit Button */}
          <Button 
            type="submit"
            className="w-full" 
            size="lg"
          >
            {isEditMode 
              ? t('add_meal.update_meal_button') 
              : currentUser 
                ? t('add_meal.create_meal_button') 
                : t('add_meal.login_to_publish')
            }
          </Button>
        </form>
      </main>

      <BottomNav />
    </div>
  );
};

export default AddMeal;
