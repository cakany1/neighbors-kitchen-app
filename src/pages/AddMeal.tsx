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
import { Upload, Shield, Plus, Minus, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { exchangeOptions } from '@/utils/ingredientDatabase';
import { TagSelector } from '@/components/meals/TagSelector';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const AddMeal = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [womenOnly, setWomenOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedExchangeOptions, setSelectedExchangeOptions] = useState<string[]>([]);
  const [useStockPhoto, setUseStockPhoto] = useState(false);
  const [barterText, setBarterText] = useState('');
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

  // Fetch current user's gender for Ladies Only feature AND check auth status
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('gender')
        .eq('id', user.id)
        .single();
      
      return { id: user.id, gender: profile?.gender };
    },
  });

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
    
    // Check if user is authenticated FIRST
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Bitte melde dich an, um ein Gericht zu teilen.');
      navigate('/login');
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

    if (selectedExchangeOptions.length === 0) {
      toast.error(t('toast.select_exchange_option'));
      return;
    }

    // Validate minimum price if money is selected
    const priceCents = formData.restaurantReferencePrice 
      ? Math.round(parseFloat(formData.restaurantReferencePrice) * 100) 
      : 0;
    
    if (selectedExchangeOptions.includes('online') && priceCents < 700) {
      toast.error('Mindestpreis: CHF 7.00 (inkl. Gebühr)');
      return;
    }

    if (selectedExchangeOptions.includes('online') && priceCents > 5000) {
      toast.error('Maximaler Preis: CHF 50.00. Für Catering kontaktiere uns bitte direkt.');
      return;
    }

    try {
      // Get current user profile with address
      const { data: profile } = await supabase
        .from('profiles')
        .select('private_address, private_city, private_postal_code')
        .eq('id', user.id)
        .single();

      if (!profile?.private_address || !profile?.private_city) {
        toast.error('Bitte vervollständige deine Adresse im Profil.');
        navigate('/profile');
        return;
      }

      toast.loading('Gericht wird erstellt...');

      // 1. Geocode chef's exact address
      const { data: geoData, error: geoError } = await supabase.functions.invoke('geocode-address', {
        body: {
          street: profile.private_address,
          city: profile.private_city,
          postalCode: profile.private_postal_code || ''
        }
      });

      if (geoError || !geoData?.lat || !geoData?.lng) {
        console.error('Geocoding error:', geoError);
        toast.error('Adresse konnte nicht gefunden werden. Bitte prüfe deine Profiladresse.');
        return;
      }

      // 2. Add random offset for fuzzy location (±200m ≈ ±0.002 degrees)
      const fuzzyLat = geoData.lat + (Math.random() * 0.004 - 0.002);
      const fuzzyLng = geoData.lng + (Math.random() * 0.004 - 0.002);

      // 3. Combine scheduled date and collection start time
      const scheduledDateTime = `${formData.scheduledDate}T${formData.collectionWindowStart || '18:00'}:00`;

      // 4. Prepare meal data
      const baseDescription = formData.description.trim() || formData.title.trim();
      const finalDescription = selectedExchangeOptions.includes('barter') && barterText.trim()
        ? `Gegenleistung: ${barterText.trim()}\n\n${baseDescription}`
        : baseDescription;

      const mealData = {
        chef_id: user.id,
        title: formData.title.trim(),
        description: finalDescription,
        fuzzy_lat: fuzzyLat,
        fuzzy_lng: fuzzyLng,
        exact_address: `${profile.private_address}, ${profile.private_city}`,
        neighborhood: profile.private_city,
        scheduled_date: scheduledDateTime,
        collection_window_start: formData.collectionWindowStart,
        collection_window_end: formData.collectionWindowEnd || formData.collectionWindowStart,
        available_portions: parseInt(formData.portions) || 1,
        women_only: womenOnly,
        exchange_mode: selectedExchangeOptions.join(','),
        pricing_minimum: selectedExchangeOptions.includes('online') ? priceCents : 0,
        pricing_suggested: selectedExchangeOptions.includes('online') ? priceCents : null,
        restaurant_reference_price: selectedExchangeOptions.includes('online') ? priceCents : null,
        allergens: selectedAllergens.length > 0 ? selectedAllergens : null,
        tags: tags.length > 0 ? tags : null,
        is_stock_photo: useStockPhoto,
        handover_mode: 'pickup_box',
        unit_type: 'portions',
        is_cooking_experience: false,
      };

      // 5. Insert meal into database
      const { data: newMeal, error: insertError } = await supabase
        .from('meals')
        .insert(mealData)
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        toast.error('Fehler beim Erstellen des Gerichts. Bitte versuche es erneut.');
        return;
      }

      toast.success('✅ Gericht ist live! Dein Essen ist jetzt sichtbar.');
      
      // Navigate to the new meal detail page
      setTimeout(() => {
        navigate(`/meal/${newMeal.id}`);
      }, 1000);

    } catch (error) {
      console.error('Error creating meal:', error);
      toast.error('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Essen anbieten</h1>
          <p className="text-muted-foreground">Erstelle ein Angebot für dein selbstgekochtes Gericht</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title & Description */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label htmlFor="title" className="text-lg font-semibold">
                  Was gibt&apos;s heute? *
                </Label>
                <Input
                  id="title"
                  placeholder="z.B. Hausgemachte Kürbis-Lasagne"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="text-base h-12"
                  required
                />
              </div>

              {/* Description - Moved from accordion */}
              <div>
                <Label htmlFor="description" className="text-base font-medium">
                  Kleine Beschreibung (Optional)
                </Label>
                <Textarea
                  id="description"
                  placeholder="Beschreibe dein Gericht, Zutaten und besondere Details..."
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
              <Label className="text-lg font-semibold mb-3 block">Anzahl Portionen *</Label>
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
                  Abholbereit ab *
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
                    Heute
                  </Button>
                  <Button
                    type="button"
                    variant={formData.scheduledDate === new Date(Date.now() + 86400000).toISOString().split('T')[0] ? 'default' : 'outline'}
                    onClick={() => {
                      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
                      setFormData({ ...formData, scheduledDate: tomorrow });
                    }}
                  >
                    Morgen
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const dateInput = document.getElementById('scheduledDate') as HTMLInputElement;
                      dateInput?.showPicker?.();
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
                <Label className="text-lg font-semibold block">Abholzeit *</Label>
                <p className="text-sm text-muted-foreground">Wann können Gäste das Essen abholen?</p>
                
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

          {/* Exchange Options */}
          <Card>
            <CardHeader>
              <CardTitle>Dein Wunsch an den Gast *</CardTitle>
              <CardDescription>Was akzeptierst du als Gegenleistung?</CardDescription>
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
                          {isOnline && (
                            <p className="text-xs text-muted-foreground mt-1 ml-6">
                              (Es werden CHF 2.00 für den App-Service vom Betrag abgezogen.)
                            </p>
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
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* NEW: Audience & Safety Section */}
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Wer darf abholen?
              </CardTitle>
              <CardDescription>
                Hinweis: Einschränkungen können dazu führen, dass sich weniger Nachbarn melden.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
