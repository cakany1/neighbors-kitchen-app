import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { barterOptions } from '@/utils/ingredientDatabase';
import { TagSelector } from '@/components/meals/TagSelector';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const AddMeal = () => {
  const navigate = useNavigate();
  const [isCookingExperience, setIsCookingExperience] = useState(false);
  const [womenOnly, setWomenOnly] = useState(false);
  const [exchangeMode, setExchangeMode] = useState<'money' | 'barter'>('money');
  const [handoverMode, setHandoverMode] = useState<'pickup_box' | 'neighbor_plate' | 'ghost_mode' | 'dine_in'>('pickup_box');
  const [identityReveal, setIdentityReveal] = useState<'real_name' | 'nickname'>('nickname');
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedBarterItems, setSelectedBarterItems] = useState<string[]>([]);
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
    if (formData.title.trim() && exchangeMode === 'money') {
      const timer = setTimeout(() => {
        runPriceDetective();
      }, 1000); // Debounce for 1 second
      
      return () => clearTimeout(timer);
    }
  }, [formData.title, exchangeMode]);

  const toggleBarterItem = (item: string) => {
    setSelectedBarterItems(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  // Price Detective - Auto-detect restaurant prices
  const runPriceDetective = () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a meal title first');
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
      toast.success('Price range found!');
    }, 1500);
  };

  const usePriceDetectiveResult = () => {
    if (priceDetectiveResult) {
      const avgPrice = (priceDetectiveResult.min + priceDetectiveResult.max) / 2;
      setFormData({ ...formData, restaurantReferencePrice: avgPrice.toFixed(2) });
      toast.success('Average price applied!');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check verification status
    if (currentUser?.verification_status === 'pending') {
      toast.error('Dein Profil wird noch überprüft. Bitte warte auf die Freigabe.');
      return;
    }
    
    if (!formData.title || !formData.description || !formData.scheduledDate || !formData.scheduledTime) {
      toast.error('Please fill in all required fields including date and time');
      return;
    }

    if (!formData.collectionWindowStart && (handoverMode === 'pickup_box' || handoverMode === 'neighbor_plate' || handoverMode === 'ghost_mode')) {
      toast.error('Please set a collection window');
      return;
    }

    if (handoverMode === 'dine_in' && (!formData.arrivalTime || !formData.maxSeats)) {
      toast.error('Please set arrival time and max guest capacity for Kitchen Experience');
      return;
    }

    if (exchangeMode === 'barter' && selectedBarterItems.length === 0) {
      toast.error('Please select at least one barter option');
      return;
    }

    toast.success('Meal listing created! Your neighbors will see it soon.');
    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Verification Pending Banner */}
        {currentUser?.verification_status === 'pending' && (
          <Alert className="mb-6 border-warning bg-warning/10">
            <Shield className="h-4 w-4 text-warning" />
            <AlertDescription className="text-sm">
              <strong>Dein Profil wird gerade überprüft.</strong> Du kannst noch keine Mahlzeiten teilen, bis dein Profil freigegeben wurde.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Share a Meal</h1>
          <p className="text-muted-foreground">Create a listing for your home-cooked dish</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo Upload */}
          <Card>
            <CardContent className="pt-6">
              <Label htmlFor="photo" className="block mb-2 font-medium">Dish Photo</Label>
              {!useStockPhoto ? (
                <>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                    <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-1">Click to upload photo</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
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
                    Haven't cooked yet? Use a symbolic image
                  </Button>
                </>
              ) : (
                <div className="space-y-3">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      📷 A symbolic/stock image will be displayed with a "Symbolbild" badge
                    </AlertDescription>
                  </Alert>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setUseStockPhoto(false)}
                    className="w-full"
                  >
                    Upload my own photo instead
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Dish Name *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Vietnamese Summer Rolls"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your dish, ingredients, and any special details..."
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
                      Cooking Experience
                    </Label>
                    <Switch
                      id="cooking-experience"
                      checked={isCookingExperience}
                      onCheckedChange={setIsCookingExperience}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Invite people into your kitchen to watch the cooking process and enjoy an apéro together
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
                      Only female guests can book this meal. This setting helps create a safe, comfortable environment for women-only gatherings.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

              {/* Exchange Model Toggle */}
          <Card>
            <CardHeader>
              <CardTitle>Exchange Model</CardTitle>
              <CardDescription>Choose how you want to be compensated</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant={exchangeMode === 'money' ? 'default' : 'outline'}
                  onClick={() => setExchangeMode('money')}
                  className="flex-1"
                >
                  💰 Pay What You Want
                </Button>
                <Button
                  type="button"
                  variant={exchangeMode === 'barter' ? 'default' : 'outline'}
                  onClick={() => setExchangeMode('barter')}
                  className="flex-1"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Bring What You Want
                </Button>
              </div>

              {exchangeMode === 'money' ? (
                <div className="space-y-4 pt-2">
                  {/* Price Detective - Auto-runs */}
                  {(priceDetectiveLoading || priceDetectiveResult) && (
                    <div className="border border-border rounded-lg p-4 space-y-3">
                      <Label className="text-sm font-medium">Price Detective 🔍</Label>
                      {priceDetectiveLoading && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                          Scanning neighborhood restaurant prices...
                        </div>
                      )}
                      {priceDetectiveResult && !priceDetectiveLoading && (
                        <Alert className="bg-primary/10 border-primary">
                          <AlertDescription className="space-y-2">
                            <p className="text-sm font-medium">
                              Found! "{formData.title}" in Basel St. Johann costs between: <strong>CHF {priceDetectiveResult.min.toFixed(2)}</strong> and <strong>CHF {priceDetectiveResult.max.toFixed(2)}</strong>
                            </p>
                            <Button 
                              type="button" 
                              size="sm" 
                              onClick={usePriceDetectiveResult}
                              className="w-full"
                            >
                              Use Average as Value Anchor
                            </Button>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}

                  <div>
                    <Label htmlFor="restaurantReferencePrice">Restaurant Reference Price (CHF)</Label>
                    <Input
                      id="restaurantReferencePrice"
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="e.g., 24"
                      value={formData.restaurantReferencePrice}
                      onChange={(e) => setFormData({ ...formData, restaurantReferencePrice: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      What would this dish cost at a restaurant? (Optional anchor price)
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="minimumPrice">Minimum Price (CHF)</Label>
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
                      People will pay after eating and can choose to pay more
                    </p>
                  </div>
                </div>
              ) : (
                <div className="pt-2">
                  <Label className="mb-3 block">What would you like in exchange? *</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 pb-2 border-b border-border">
                      <Checkbox
                        id="barter-any"
                        checked={selectedBarterItems.length === barterOptions.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedBarterItems([...barterOptions]);
                          } else {
                            setSelectedBarterItems([]);
                          }
                        }}
                      />
                      <Label
                        htmlFor="barter-any"
                        className="text-sm font-medium cursor-pointer"
                      >
                        ✨ Any of these (Guest's choice)
                      </Label>
                    </div>
                    {barterOptions.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          id={`barter-${option}`}
                          checked={selectedBarterItems.includes(option)}
                          onCheckedChange={() => toggleBarterItem(option)}
                        />
                        <Label
                          htmlFor={`barter-${option}`}
                          className="text-sm font-normal cursor-pointer flex items-center gap-2"
                        >
                          {option === 'Just a Smile (Free)' && '😊'}
                          {option === 'A Bottle of Wine' && '🍷'}
                          {option === 'Dessert' && '🍰'}
                          {option === 'Fruit' && '🍎'}
                          {option === 'Surprise Me' && '🎁'}
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Handover Mode */}
          <Card>
            <CardHeader>
              <CardTitle>Handover & Privacy</CardTitle>
              <CardDescription>How will guests receive their meal?</CardDescription>
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
                  <span className="text-xs">Pickup (Bring Tupperware)</span>
                </Button>
                <Button
                  type="button"
                  variant={handoverMode === 'neighbor_plate' ? 'default' : 'outline'}
                  onClick={() => setHandoverMode('neighbor_plate')}
                  className="h-auto py-3 flex-col"
                >
                  <span className="text-2xl mb-1">🍽️</span>
                  <span className="text-xs">Neighbor (Plate)</span>
                </Button>
                <Button
                  type="button"
                  variant={handoverMode === 'ghost_mode' ? 'default' : 'outline'}
                  onClick={() => setHandoverMode('ghost_mode')}
                  className="h-auto py-3 flex-col"
                >
                  <span className="text-2xl mb-1">👻</span>
                  <span className="text-xs">Ghost Mode</span>
                </Button>
                <Button
                  type="button"
                  variant={handoverMode === 'dine_in' ? 'default' : 'outline'}
                  onClick={() => setHandoverMode('dine_in')}
                  className="h-auto py-3 flex-col"
                >
                  <span className="text-2xl mb-1">🍴</span>
                  <span className="text-xs">Dine In</span>
                </Button>
              </div>

              {/* Identity Reveal Options */}
              <div className="pt-2">
                <Label className="text-sm font-medium mb-2 block">What to reveal when booking is confirmed?</Label>
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
                      Real Name + Address
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
                      Nickname + Address {handoverMode === 'ghost_mode' && '+ Instructions'}
                    </Label>
                  </div>
                </div>
              </div>

              {/* Collection Window */}
              {handoverMode !== 'dine_in' && (
                <div className="pt-2">
                  <Label className="text-sm font-medium mb-2 block">
                    Collection Window * (24h format)
                  </Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Set a time range to avoid disruptions (e.g., 17:00 - 19:00)
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="collectionWindowStart" className="text-xs">From</Label>
                      <Input
                        id="collectionWindowStart"
                        type="time"
                        value={formData.collectionWindowStart}
                        onChange={(e) => setFormData({ ...formData, collectionWindowStart: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="collectionWindowEnd" className="text-xs">To</Label>
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
                  <Label htmlFor="pickupInstructions">Pickup Instructions</Label>
                  <Textarea
                    id="pickupInstructions"
                    placeholder="e.g., Look for blue box at entrance, Ring bell #3"
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
              <CardTitle>Availability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="unitType">Unit Type</Label>
                <select
                  id="unitType"
                  value={formData.unitType || 'portions'}
                  onChange={(e) => setFormData({ ...formData, unitType: e.target.value as 'portions' | 'slices' | 'items' | 'whole' })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="portions">Portions (Portionen)</option>
                  <option value="slices">Slices (Stücke)</option>
                  <option value="items">Items (Einzelne Gerichte)</option>
                  <option value="whole">Whole (Ganzes)</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  How should this meal be measured?
                </p>
              </div>
              
              <div>
                <Label htmlFor="portions">
                  Available {formData.unitType === 'slices' ? 'Slices' : formData.unitType === 'items' ? 'Items' : formData.unitType === 'whole' ? 'Units' : 'Portions'}
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
                <Label htmlFor="scheduledDate">Scheduled Date *</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="scheduledTime">Meal Ready Time * (24h format)</Label>
                <Input
                  id="scheduledTime"
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  When will your meal be ready? (e.g., 20:30)
                </p>
              </div>
              
              {/* Dine In specific fields */}
              {handoverMode === 'dine_in' && (
                <>
                  <div>
                    <Label htmlFor="arrivalTime">Guest Arrival Time * (24h format)</Label>
                    <Input
                      id="arrivalTime"
                      type="time"
                      value={formData.arrivalTime}
                      onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      What time should guests arrive? (e.g., 19:00)
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="maxSeats">Max Guest Capacity *</Label>
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
                      How many people can join at your table?
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
            disabled={currentUser?.verification_status === 'pending'}
          >
            {currentUser?.verification_status === 'pending' 
              ? 'Warte auf Verifizierung...' 
              : 'Create Meal Listing'}
          </Button>
        </form>
      </main>

      <BottomNav />
    </div>
  );
};

export default AddMeal;
