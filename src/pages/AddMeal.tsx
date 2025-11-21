import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, ChefHat, Gift, AlertCircle, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { exchangeOptions } from '@/utils/ingredientDatabase';
import { TagSelector } from '@/components/meals/TagSelector';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const AddMeal = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isCookingExperience, setIsCookingExperience] = useState(false);
  const [womenOnly, setWomenOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [handoverMode, setHandoverMode] = useState<'pickup_box' | 'neighbor_plate' | 'ghost_mode' | 'dine_in'>('pickup_box');
  const [identityReveal, setIdentityReveal] = useState<'real_name' | 'nickname'>('nickname');
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedExchangeOptions, setSelectedExchangeOptions] = useState<string[]>([]);
  const [priceDetectiveLoading, setPriceDetectiveLoading] = useState(false);
  const [priceDetectiveResult, setPriceDetectiveResult] = useState<{ min: number; max: number } | null>(null);
  const [useStockPhoto, setUseStockPhoto] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    minimumPrice: '',
    restaurantReferencePrice: '',
    portions: '',
    unitType: 'portions' as 'portions' | 'slices' | 'items' | 'whole',
    maxSeats: '',
    scheduledDate: '',
    scheduledTime: '',
    arrivalTime: '',
    collectionWindowStart: '',
    collectionWindowEnd: '',
    pickupInstructions: '',
  });

  // Fetch current user's gender and verification status for Ladies Only feature
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('gender, verification_status')
        .eq('id', user.id)
        .single();
      
      return { id: user.id, gender: profile?.gender, verification_status: profile?.verification_status };
    },
  });

  // Auto-run Price Detective when title changes
  useEffect(() => {
    if (formData.title.trim() && selectedExchangeOptions.includes('money')) {
      const timer = setTimeout(() => {
        runPriceDetective();
      }, 1000); // Debounce for 1 second
      
      return () => clearTimeout(timer);
    }
  }, [formData.title, selectedExchangeOptions]);

  const toggleExchangeOption = (option: string) => {
    setSelectedExchangeOptions(prev =>
      prev.includes(option) ? prev.filter(i => i !== option) : [...prev, option]
    );
  };

  // Price Detective - Auto-detect restaurant prices
  const runPriceDetective = () => {
    if (!formData.title.trim()) {
      toast.error(t('toast.meal_title_required'));
      return;
    }
    
    setPriceDetectiveLoading(true);
    
    // Mock API call - simulate price range discovery
    setTimeout(() => {
      // Mock price range based on meal title length (simulation)
      const basePrice = formData.title.length * 2 + Math.random() * 5;
      const minPrice = Math.round(basePrice * 100) / 100;
      const maxPrice = Math.round((basePrice + 3 + Math.random() * 3) * 100) / 100;
      setPriceDetectiveResult({ min: minPrice, max: maxPrice });
      setPriceDetectiveLoading(false);
      toast.success(t('toast.price_range_found'));
    }, 1500);
  };

  const usePriceDetectiveResult = () => {
    if (priceDetectiveResult) {
      const avgPrice = (priceDetectiveResult.min + priceDetectiveResult.max) / 2;
      setFormData({ ...formData, restaurantReferencePrice: avgPrice.toFixed(2) });
      toast.success(t('toast.price_applied'));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.scheduledDate || !formData.scheduledTime) {
      toast.error(t('toast.fill_required_fields'));
      return;
    }

    if (!formData.collectionWindowStart && (handoverMode === 'pickup_box' || handoverMode === 'neighbor_plate' || handoverMode === 'ghost_mode')) {
      toast.error(t('toast.set_collection_window'));
      return;
    }

    if (handoverMode === 'dine_in' && (!formData.arrivalTime || !formData.maxSeats)) {
      toast.error(t('toast.set_arrival_time'));
      return;
    }

    if (selectedExchangeOptions.length === 0) {
      toast.error(t('toast.select_exchange_option'));
      return;
    }

    toast.success(t('toast.meal_created'));
    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Essen teilen</h1>
          <p className="text-muted-foreground">Erstelle ein Angebot für dein selbstgekochtes Gericht</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo Upload */}
          <Card>
            <CardContent className="pt-6">
              <Label htmlFor="photo" className="block mb-2 font-medium">Foto vom Gericht</Label>
              {!useStockPhoto ? (
                <>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                    <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-1">Klicke zum Hochladen</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG bis 10MB</p>
                    <input 
                      type="file" 
                      id="photo" 
                      accept="image/*" 
                      className="hidden"
                    />
                  </div>
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
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      📷 Ein Symbolbild wird mit dem Badge "Symbolbild" angezeigt
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
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Grundinformationen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Name des Gerichts *</Label>
                <Input
                  id="title"
                  placeholder="z.B. Vietnamesische Sommerrollen"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Beschreibung *</Label>
                <Textarea
                  id="description"
                  placeholder="Beschreibe dein Gericht, Zutaten und besondere Details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Allergens & Tags Selector */}
          <TagSelector
            selectedAllergens={selectedAllergens}
            onAllergensChange={setSelectedAllergens}
            selectedTags={tags}
            onTagsChange={setTags}
          />

          {/* Cooking Experience */}
          <Card className="border-secondary">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <ChefHat className="w-6 h-6 text-secondary mt-1" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="cooking-experience" className="text-base font-semibold">
                      Koch-Erlebnis
                    </Label>
                    <Switch
                      id="cooking-experience"
                      checked={isCookingExperience}
                      onCheckedChange={setIsCookingExperience}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Lade Leute in deine Küche ein, um beim Kochen zuzuschauen und gemeinsam einen Apéro zu genießen
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ladies Only Mode (Safety Feature for Women Chefs) */}
          {currentUser?.gender === 'female' && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Shield className="w-6 h-6 text-destructive mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="women-only" className="text-base font-semibold">
                        👩 Ladies Only (Nur für Frauen)
                      </Label>
                      <Switch
                        id="women-only"
                        checked={womenOnly}
                        onCheckedChange={setWomenOnly}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Nur weibliche Gäste können dieses Essen buchen. Diese Einstellung hilft, eine sichere und angenehme Umgebung zu schaffen.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Verified Only Mode (Trust Filter) */}
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Shield className="w-6 h-6 text-primary mt-1" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="verified-only" className="text-base font-semibold">
                      ✓ Nur verifizierte Nutzer zulassen?
                    </Label>
                    <Switch
                      id="verified-only"
                      checked={verifiedOnly}
                      onCheckedChange={setVerifiedOnly}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Nur verifizierte Gäste (Telefon oder ID) können dieses Essen buchen. Erhöht Vertrauen und Sicherheit.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Exchange Options - Unified List */}
          <Card>
            <CardHeader>
              <CardTitle>Dein Wunsch an den Gast</CardTitle>
              <CardDescription>Was akzeptierst du als Gegenleistung?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Label className="mb-3 block">Wähle alle Optionen, die du akzeptierst:</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Gäste können eine dieser Optionen wählen. Mehrfachauswahl möglich.
              </p>
              
              {/* Price Detective - Auto-runs when money is selected */}
              {selectedExchangeOptions.includes('money') && (priceDetectiveLoading || priceDetectiveResult) && (
                <div className="border border-border rounded-lg p-4 space-y-3 mb-4">
                  <Label className="text-sm font-medium">Price Detective 🔍</Label>
                  {priceDetectiveLoading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                      Scanne Restaurant-Preise in der Nachbarschaft...
                    </div>
                  )}
                  {priceDetectiveResult && !priceDetectiveLoading && (
                    <Alert className="bg-primary/10 border-primary">
                      <AlertDescription className="space-y-2">
                        <p className="text-sm font-medium">
                          Gefunden! "{formData.title}" in Basel St. Johann kostet zwischen: <strong>CHF {priceDetectiveResult.min.toFixed(2)}</strong> und <strong>CHF {priceDetectiveResult.max.toFixed(2)}</strong>
                        </p>
                        <Button 
                          type="button" 
                          size="sm" 
                          onClick={usePriceDetectiveResult}
                          className="w-full"
                        >
                          Durchschnitt als Richtwert verwenden
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
              
              <div className="space-y-3">
                {exchangeOptions.map((option) => (
                  <div key={option.value} className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                    <Checkbox
                      id={`exchange-${option.value}`}
                      checked={selectedExchangeOptions.includes(option.value)}
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
                ))}
              </div>

              {/* Money-specific fields */}
              {selectedExchangeOptions.includes('money') && (
                <div className="space-y-4 pt-2 border-t border-border mt-4">
                  <div>
                    <Label htmlFor="restaurantReferencePrice">Restaurant-Referenzpreis (CHF)</Label>
                    <Input
                      id="restaurantReferencePrice"
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="z.B. 24"
                      value={formData.restaurantReferencePrice}
                      onChange={(e) => setFormData({ ...formData, restaurantReferencePrice: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Was würde dieses Gericht im Restaurant kosten? (Optionaler Richtwert)
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="minimumPrice">Mindestpreis (CHF)</Label>
                    <Input
                      id="minimumPrice"
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="0"
                      value={formData.minimumPrice}
                      onChange={(e) => setFormData({ ...formData, minimumPrice: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Gäste zahlen nach dem Essen und können mehr geben
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Handover Mode */}
          <Card>
            <CardHeader>
              <CardTitle>Übergabe & Ort</CardTitle>
              <CardDescription>Wie soll das Essen übergeben werden?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={handoverMode === 'pickup_box' ? 'default' : 'outline'}
                  onClick={() => setHandoverMode('pickup_box')}
                  className="h-auto py-3 flex-col"
                >
                  <span className="text-2xl mb-1">📦</span>
                  <span className="text-xs">Abholung (Tupperware mitbringen)</span>
                </Button>
                <Button
                  type="button"
                  variant={handoverMode === 'neighbor_plate' ? 'default' : 'outline'}
                  onClick={() => setHandoverMode('neighbor_plate')}
                  className="h-auto py-3 flex-col"
                >
                  <span className="text-2xl mb-1">🍽️</span>
                  <span className="text-xs">Nachbar (eigener Teller)</span>
                </Button>
                <Button
                  type="button"
                  variant={handoverMode === 'ghost_mode' ? 'default' : 'outline'}
                  onClick={() => setHandoverMode('ghost_mode')}
                  className="h-auto py-3 flex-col"
                >
                  <span className="text-2xl mb-1">👻</span>
                  <span className="text-xs">Kontaktlos (Eingang/Briefkasten)</span>
                </Button>
                <Button
                  type="button"
                  variant={handoverMode === 'dine_in' ? 'default' : 'outline'}
                  onClick={() => setHandoverMode('dine_in')}
                  className="h-auto py-3 flex-col"
                >
                  <span className="text-2xl mb-1">🍴</span>
                  <span className="text-xs">Zu Gast (Am Tisch essen)</span>
                </Button>
              </div>

              {/* Identity Reveal Options */}
              <div className="pt-2">
                <Label className="text-sm font-medium mb-2 block">Was soll bei Buchungsbestätigung preisgegeben werden?</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="real_name"
                      name="identity"
                      value="real_name"
                      checked={identityReveal === 'real_name'}
                      onChange={() => setIdentityReveal('real_name')}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="real_name" className="text-sm font-normal cursor-pointer">
                      Echter Name + Adresse
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="nickname"
                      name="identity"
                      value="nickname"
                      checked={identityReveal === 'nickname'}
                      onChange={() => setIdentityReveal('nickname')}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="nickname" className="text-sm font-normal cursor-pointer">
                      Nickname + Adresse {handoverMode === 'ghost_mode' && '+ Anweisungen'}
                    </Label>
                  </div>
                </div>
              </div>

              {/* Collection Window */}
              {handoverMode !== 'dine_in' && (
                <div className="pt-2">
                  <Label className="text-sm font-medium mb-2 block">
                    Abholzeitraum * (24h Format)
                  </Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Setze ein Zeitfenster, um Störungen zu vermeiden (z.B. 17:00 - 19:00)
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="collectionWindowStart" className="text-xs">Von</Label>
                      <Input
                        id="collectionWindowStart"
                        type="time"
                        value={formData.collectionWindowStart}
                        onChange={(e) => setFormData({ ...formData, collectionWindowStart: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="collectionWindowEnd" className="text-xs">Bis</Label>
                      <Input
                        id="collectionWindowEnd"
                        type="time"
                        value={formData.collectionWindowEnd}
                        onChange={(e) => setFormData({ ...formData, collectionWindowEnd: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Pickup Instructions */}
              {handoverMode === 'ghost_mode' && (
                <div>
                  <Label htmlFor="pickupInstructions">Abholanweisungen</Label>
                  <Textarea
                    id="pickupInstructions"
                    placeholder="z.B. Blaue Box am Eingang, Klingel Nr. 3"
                    value={formData.pickupInstructions}
                    onChange={(e) => setFormData({ ...formData, pickupInstructions: e.target.value })}
                    rows={2}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Portions & Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Verfügbarkeit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="unitType">Einheits-Typ</Label>
                <select
                  id="unitType"
                  value={formData.unitType || 'portions'}
                  onChange={(e) => setFormData({ ...formData, unitType: e.target.value as 'portions' | 'slices' | 'items' | 'whole' })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="portions">Portionen</option>
                  <option value="slices">Stücke</option>
                  <option value="items">Einzelne Gerichte</option>
                  <option value="whole">Ganzes</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Wie soll dieses Essen gemessen werden?
                </p>
              </div>
              
              <div>
                <Label htmlFor="portions">
                  Verfügbare {formData.unitType === 'slices' ? 'Stücke' : formData.unitType === 'items' ? 'Gerichte' : formData.unitType === 'whole' ? 'Einheiten' : 'Portionen'}
                </Label>
                <Input
                  id="portions"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={formData.portions}
                  onChange={(e) => setFormData({ ...formData, portions: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="scheduledDate">Geplantes Datum *</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="scheduledTime">Essen fertig um * (24h Format)</Label>
                <Input
                  id="scheduledTime"
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Wann wird dein Essen fertig sein? (z.B. 20:30)
                </p>
              </div>
              
              {/* Dine In specific fields */}
              {handoverMode === 'dine_in' && (
                <>
                  <div>
                    <Label htmlFor="arrivalTime">Gäste-Ankunftszeit * (24h Format)</Label>
                    <Input
                      id="arrivalTime"
                      type="time"
                      value={formData.arrivalTime}
                      onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Wann sollen die Gäste ankommen? (z.B. 19:00)
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="maxSeats">Maximale Gästeanzahl *</Label>
                    <Input
                      id="maxSeats"
                      type="number"
                      min="1"
                      placeholder="2"
                      value={formData.maxSeats}
                      onChange={(e) => setFormData({ ...formData, maxSeats: e.target.value })}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Wie viele Personen können an deinem Tisch teilnehmen?
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
          >
            Mahlzeit erstellen
          </Button>
        </form>
      </main>

      <BottomNav />
    </div>
  );
};

export default AddMeal;
