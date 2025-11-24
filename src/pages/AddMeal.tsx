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
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Upload, Shield, Plus, Minus } from 'lucide-react';
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
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ingredients: '',
    restaurantReferencePrice: '',
    portions: '1',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '',
    collectionWindowStart: '',
    collectionWindowEnd: '',
  });

  // Fetch current user's gender for Ladies Only feature
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.scheduledDate || !formData.scheduledTime) {
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

    toast.success('✅ Gericht erstellt! Dein Essen ist jetzt sichtbar.');
    setTimeout(() => {
      navigate('/feed');
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
          {/* Title */}
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

          {/* Time Selection - Smart Chips */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Label className="text-lg font-semibold">Abholzeit *</Label>
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
              <div className="pt-2">
                <Label className="text-sm text-muted-foreground">Oder manuell eingeben:</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
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
                    {/* Description */}
                    <div>
                      <Label htmlFor="description">Beschreibung</Label>
                      <Textarea
                        id="description"
                        placeholder="Beschreibe dein Gericht, Zutaten und besondere Details..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={4}
                      />
                    </div>

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
                    {selectedExchangeOptions.includes('money') && (
                      <div className="space-y-4 pt-2 border-t border-border">
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
                        </div>
                      </div>
                    )}

                    {/* Advanced Options */}
                    <div className="space-y-4 pt-4 border-t border-border">
                      <h3 className="text-sm font-semibold text-muted-foreground">Erweiterte Optionen</h3>
                      
                      {/* Ladies Only */}
                      {currentUser?.gender === 'female' && (
                        <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-destructive" />
                            <Label htmlFor="women-only" className="text-sm cursor-pointer">
                              👩 Ladies Only
                            </Label>
                          </div>
                          <Switch
                            id="women-only"
                            checked={womenOnly}
                            onCheckedChange={setWomenOnly}
                          />
                        </div>
                      )}

                      {/* Verified Only */}
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-primary" />
                          <Label htmlFor="verified-only" className="text-sm cursor-pointer">
                            ✓ Nur Verifizierte
                          </Label>
                        </div>
                        <Switch
                          id="verified-only"
                          checked={verifiedOnly}
                          onCheckedChange={setVerifiedOnly}
                        />
                      </div>
                    </div>
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          </Accordion>

          {/* Date & Time */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="scheduledDate">Abholbereit ab *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date().toISOString().split('T')[0];
                      setFormData({ ...formData, scheduledDate: today });
                    }}
                  >
                    Heute
                  </Button>
                </div>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="scheduledTime">Fertig um * (24h Format)</Label>
                <Input
                  id="scheduledTime"
                  type="time"
                  step="900"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
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
