import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Upload, Shield, Plus, Minus, Calendar as CalendarIcon, Keyboard } from 'lucide-react';
import { toast } from 'sonner';
import { exchangeOptions } from '@/utils/ingredientDatabase';
import { hashToConsistentOffset } from '@/utils/fuzzyLocation';
import { validateMealContent } from '@/utils/contentFilter';
import { TagSelector } from '@/components/meals/TagSelector';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const AddMeal = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [womenOnly, setWomenOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [visibilityRadius, setVisibilityRadius] = useState<number | null>(null); // null = no limit
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedExchangeOptions, setSelectedExchangeOptions] = useState<string[]>([]);
  const [useStockPhoto, setUseStockPhoto] = useState(false);
  const [barterText, setBarterText] = useState('');
  const [containerPolicy, setContainerPolicy] = useState<'bring_container' | 'plate_ok' | 'either_ok'>('either_ok');
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
  const hourOptions = Array.from({ length: 18 }, (_, i) => {
    const hour = (i + 6).toString().padStart(2, '0');
    return { value: hour, label: `${hour} Uhr` };
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
        .select('gender, avatar_url, private_address, private_city, private_postal_code')
        .eq('id', user.id)
        .single();
      
      return { 
        id: user.id, 
        gender: profile?.gender, 
        avatarUrl: profile?.avatar_url,
        hasAddress: !!(profile?.private_address && profile?.private_city),
        privateAddress: profile?.private_address || '',
        privateCity: profile?.private_city || '',
        privatePostalCode: profile?.private_postal_code || '',
      };
    },
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: 'always',
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

  const toggleExchangeOption = (option: string) => {
    setSelectedExchangeOptions(prev =>
      prev.includes(option) ? prev.filter(i => i !== option) : [...prev, option]
    );
  };

  // Smart Allergen Auto-Detection
  const detectAllergens = (text: string) => {
    const lowerText = text.toLowerCase();
    const detectedAllergens: string[] = [];
    
    const allergenKeywords: Record<string, string[]> = {
      'Milch/Laktose': ['milch', 'sahne', 'käse', 'butter', 'joghurt', 'rahm', 'quark', 'schmand'],
      'Eier': ['ei', 'eier', 'spätzle'],
      'Schalenfrüchte (Nüsse)': ['nuss', 'nüsse', 'mandel', 'walnuss', 'haselnuss', 'cashew', 'pistazie'],
      'Erdnüsse': ['erdnuss', 'erdnüsse'],
      'Gluten (Getreide)': ['mehl', 'weizen', 'brot', 'pasta', 'lasagne', 'teig', 'nudel', 'spaghetti'],
      'Fisch': ['fisch', 'thunfisch', 'lachs', 'forelle', 'sardine'],
      'Soja': ['soja', 'tofu'],
      'Senf': ['senf'],
      'Sellerie': ['sellerie'],
      'Sesam': ['sesam'],
      'Lupinen': ['lupine', 'lupinen'],
      'Weichtiere': ['muschel', 'muscheln', 'schnecke', 'schnecken', 'tintenfisch'],
      'Sulfite': ['sulfit', 'sulfite', 'schwefeldioxid'],
      'Krebstiere': ['garnele', 'garnelen', 'krebs', 'hummer', 'shrimp', 'krabbe'],
    };

    Object.entries(allergenKeywords).forEach(([allergen, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        if (!detectedAllergens.includes(allergen)) {
          detectedAllergens.push(allergen);
        }
      }
    });

    if (detectedAllergens.length > 0) {
      setSelectedAllergens(prev => {
        const newAllergens = [...new Set([...prev, ...detectedAllergens])];
        return newAllergens;
      });
      toast.success(`⚡ Allergene automatisch erkannt: ${detectedAllergens.join(', ')}`, {
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
    
    // CONTENT FILTER: Use centralized filter with normalization
    const contentCheck = validateMealContent(formData.title, formData.description);
    if (!contentCheck.isValid) {
      toast.error(contentCheck.error || 'Bitte respektvolle Sprache verwenden.');
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
        toast.error('Dieser Zeitslot liegt in der Vergangenheit. Bitte wähle einen späteren Zeitpunkt.');
        return;
      }
    }

    if (selectedExchangeOptions.length === 0) {
      toast.error(t('toast.select_exchange_option'));
      return;
    }

    // Validate minimum price if money is selected
    const priceCents = formData.restaurantReferencePrice 
      ? Math.round(parseFloat(formData.restaurantReferencePrice) * 100) 
      : 0;
    
    if (selectedExchangeOptions.includes('online') && priceCents < 700) {
      toast.error(t('add_meal.price_min_error'));
      return;
    }

    if (selectedExchangeOptions.includes('online') && priceCents > 5000) {
      toast.error(t('add_meal.price_max_error'));
      return;
    }

    try {
      // Validate address data
      if (!addressData.street.trim() || !addressData.city.trim()) {
        toast.error(t('add_meal.address_required'));
        setShowAddressForm(true);
        return;
      }

      // Show loading state
      const loadingToastId = toast.loading('Gericht wird erstellt und übersetzt...');

      // Save address to profile if it's new or changed
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          private_address: addressData.street.trim(),
          private_city: addressData.city.trim(),
          private_postal_code: addressData.postalCode.trim() || null,
        })
        .eq('id', user.id);

      if (profileUpdateError) {
        console.error('Profile update error:', profileUpdateError);
        toast.dismiss(loadingToastId);
        toast.error('Adresse konnte nicht gespeichert werden.');
        return;
      }

      // Get visibility_mode from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('visibility_mode')
        .eq('id', user.id)
        .single();

      // 1. Geocode chef's exact address
      const { data: geoData, error: geoError } = await supabase.functions.invoke('geocode-address', {
        body: {
          street: addressData.street.trim(),
          city: addressData.city.trim(),
          postalCode: addressData.postalCode.trim() || ''
        }
      });

      // Handle geocoding response with robust null checks
      if (geoError) {
        console.error('Geocoding error:', geoError);
        toast.dismiss(loadingToastId);
        toast.error('Adresse konnte nicht gefunden werden. Bitte prüfe deine Profiladresse.');
        return;
      }

      // Check for valid coordinates (response uses 'latitude' and 'longitude', not 'lat' and 'lng')
      if (!geoData || typeof geoData.latitude !== 'number' || typeof geoData.longitude !== 'number') {
        console.error('Invalid geocoding response:', geoData);
        toast.dismiss(loadingToastId);
        toast.error('Adresse konnte nicht in Koordinaten umgewandelt werden. Bitte prüfe deine Profiladresse.');
        return;
      }

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
        visibility_mode: profile.visibility_mode || 'all', // Use chef's visibility preference
        visibility_radius: visibilityRadius, // Chef-set distance limit in meters
        // Map UI options to DB valid values: 'online' -> 'money', everything else -> 'barter'
        exchange_mode: selectedExchangeOptions.includes('online') ? 'money' : 'barter',
        pricing_minimum: selectedExchangeOptions.includes('online') ? priceCents : 0,
        pricing_suggested: selectedExchangeOptions.includes('online') ? priceCents : null,
        restaurant_reference_price: selectedExchangeOptions.includes('online') ? priceCents : null,
        allergens: selectedAllergens.length > 0 ? selectedAllergens : null,
        tags: tags.length > 0 ? tags : null,
        is_stock_photo: useStockPhoto,
        handover_mode: 'pickup_box',
        unit_type: 'portions',
        is_cooking_experience: false,
        container_policy: containerPolicy,
      };

      // 5. Insert meal into database
      const { data: newMeal, error: insertError } = await supabase
        .from('meals')
        .insert(mealData)
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        toast.dismiss(loadingToastId);
        toast.error(`Fehler beim Erstellen: ${insertError.message || 'Bitte versuche es erneut.'}`);
        return;
      }

      toast.dismiss(loadingToastId);
      toast.success('✅ Gericht ist live! Dein Essen ist jetzt sichtbar.');
      
      // Navigate to the new meal detail page
      setTimeout(() => {
        navigate(`/meal/${newMeal.id}`);
      }, 1000);

    } catch (error) {
      console.error('Error creating meal:', error);
      toast.dismiss();
      toast.error('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">{t('add_meal.page_title')}</h1>
          <p className="text-muted-foreground">{t('add_meal.page_subtitle')}</p>
        </div>

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
                    dateInput.onchange = (e) => {
                      const target = e.target as HTMLInputElement;
                      if (target.value) {
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
                        if (!isNaN(parsedDate.getTime())) {
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
                  {['17:00', '18:00', '19:00', '20:00'].map((time) => (
                    <Button
                      key={time}
                      type="button"
                      variant={formData.collectionWindowStart === time ? 'default' : 'outline'}
                      onClick={() => {
                        const endHour = (parseInt(time.split(':')[0]) + 1).toString().padStart(2, '0');
                        setFormData({ 
                          ...formData, 
                          collectionWindowStart: time,
                          collectionWindowEnd: `${endHour}:00`
                        });
                      }}
                      className="h-12"
                    >
                      {`${time} - ${(parseInt(time.split(':')[0]) + 1).toString().padStart(2, '0')}:00 Uhr`}
                    </Button>
                  ))}
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
                          setFormData({ ...formData, collectionWindowStart: `${hour}:${minute}` });
                        }}
                      >
                        <SelectTrigger className="h-11 w-[90px]">
                          <SelectValue placeholder="HH" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {hourOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-lg font-bold px-1">:</span>
                      <Select
                        value={formData.collectionWindowStart.split(':')[1] || ''}
                        onValueChange={(minute) => {
                          const hour = formData.collectionWindowStart.split(':')[0] || '18';
                          setFormData({ ...formData, collectionWindowStart: `${hour}:${minute}` });
                        }}
                      >
                        <SelectTrigger className="h-11 w-[90px]">
                          <SelectValue placeholder="MM" />
                        </SelectTrigger>
                        <SelectContent>
                          {minuteOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="ml-1 text-sm text-muted-foreground">Uhr</span>
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
                          setFormData({ ...formData, collectionWindowEnd: `${hour}:${minute}` });
                        }}
                      >
                        <SelectTrigger className="h-11 w-[90px]">
                          <SelectValue placeholder="HH" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {hourOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-lg font-bold px-1">:</span>
                      <Select
                        value={formData.collectionWindowEnd.split(':')[1] || ''}
                        onValueChange={(minute) => {
                          const hour = formData.collectionWindowEnd.split(':')[0] || '19';
                          setFormData({ ...formData, collectionWindowEnd: `${hour}:${minute}` });
                        }}
                      >
                        <SelectTrigger className="h-11 w-[90px]">
                          <SelectValue placeholder="MM" />
                        </SelectTrigger>
                        <SelectContent>
                          {minuteOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="ml-1 text-sm text-muted-foreground">Uhr</span>
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
                            <span>{isBarter ? 'Tausch / Zutaten (Barter)' : option.label}</span>
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
                              type="number"
                              step="0.50"
                              min="7.00"
                              max="50.00"
                              value={formData.restaurantReferencePrice}
                              onChange={(e) => setFormData({ ...formData, restaurantReferencePrice: e.target.value })}
                              placeholder="12.00"
                              className="pl-14 h-12 text-lg font-semibold text-right pr-4"
                            />
                          </div>
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
                  <SelectItem value="bring_container">📦 Bitte Tupperware mitbringen</SelectItem>
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
                      ✓ Nur Verifizierte Nutzer
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Nur Gäste mit Verifikation dürfen buchen
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
                        👩 Ladies Only
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Nur weibliche Gäste dürfen buchen
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
                    {/* Photo Upload */}
                    <div>
                      <Label className="block mb-2 font-medium">Foto vom Gericht</Label>
                      {!useStockPhoto ? (
                        <>
                          <Button 
                            type="button" 
                            variant="outline" 
                            className="w-full h-16 flex items-center justify-center gap-2"
                          >
                            <Upload className="w-5 h-5" />
                            <span>Foto hochladen +</span>
                          </Button>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setUseStockPhoto(true)}
                            className="w-full mt-2"
                          >
                            Noch nicht gekocht? Symbolbild verwenden
                          </Button>
                        </>
                      ) : (
                        <div className="space-y-3">
                          <Alert>
                            <AlertDescription>
                              📷 Ein Symbolbild wird mit dem Badge &quot;Symbolbild&quot; angezeigt
                            </AlertDescription>
                          </Alert>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setUseStockPhoto(false)}
                            className="w-full"
                          >
                            Eigenes Foto hochladen
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Allergens & Tags */}
                    <TagSelector
                      selectedAllergens={selectedAllergens}
                      onAllergensChange={setSelectedAllergens}
                      selectedTags={tags}
                      onTagsChange={setTags}
                      ingredientText={formData.ingredients}
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

          {/* Submit Button */}
          <Button 
            type="submit"
            className="w-full" 
            size="lg"
          >
            {currentUser ? 'Mahlzeit erstellen' : 'Einloggen zum Veröffentlichen'}
          </Button>
        </form>
      </main>

      <BottomNav />
    </div>
  );
};

export default AddMeal;
