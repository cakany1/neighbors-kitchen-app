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
import { Upload, ChefHat, X, Gift, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { detectAllergens, barterOptions } from '@/utils/ingredientDatabase';

const AddMeal = () => {
  const navigate = useNavigate();
  const [isCookingExperience, setIsCookingExperience] = useState(false);
  const [exchangeMode, setExchangeMode] = useState<'money' | 'barter'>('money');
  const [handoverMode, setHandoverMode] = useState<'pickup_box' | 'neighbor_plate' | 'ghost_mode' | 'dine_in'>('pickup_box');
  const [identityReveal, setIdentityReveal] = useState<'full_name' | 'first_name' | 'last_name' | 'address_only'>('full_name');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [detectedAllergens, setDetectedAllergens] = useState<string[]>([]);
  const [selectedBarterItems, setSelectedBarterItems] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    minimumPrice: '',
    restaurantReferencePrice: '',
    portions: '',
    scheduledDate: '',
    scheduledTime: '',
    collectionWindowStart: '',
    collectionWindowEnd: '',
    pickupInstructions: '',
  });

  // Auto-detect allergens when ingredients change
  useEffect(() => {
    if (ingredients.length > 0) {
      const detected = detectAllergens(ingredients);
      setDetectedAllergens(detected);
    } else {
      setDetectedAllergens([]);
    }
  }, [ingredients]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleAddIngredient = () => {
    if (ingredientInput.trim() && !ingredients.includes(ingredientInput.trim())) {
      setIngredients([...ingredients, ingredientInput.trim()]);
      setIngredientInput('');
    }
  };

  const handleRemoveIngredient = (ingredient: string) => {
    setIngredients(ingredients.filter(i => i !== ingredient));
  };

  const toggleBarterItem = (item: string) => {
    setSelectedBarterItems(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.scheduledDate || !formData.scheduledTime) {
      toast.error('Please fill in all required fields including date and time');
      return;
    }

    if (handoverMode !== 'ghost_mode' && !formData.collectionWindowStart) {
      toast.error('Please set a collection window');
      return;
    }

    if (ingredients.length === 0) {
      toast.error('Please add at least one ingredient');
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Share a Meal</h1>
          <p className="text-muted-foreground">Create a listing for your home-cooked dish</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo Upload */}
          <Card>
            <CardContent className="pt-6">
              <Label htmlFor="photo" className="block mb-2 font-medium">Dish Photo</Label>
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

          {/* Smart Ingredient Input */}
          <Card>
            <CardHeader>
              <CardTitle>Ingredients *</CardTitle>
              <CardDescription>We'll automatically detect allergens for you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add an ingredient (e.g., flour, milk, eggs)"
                  value={ingredientInput}
                  onChange={(e) => setIngredientInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddIngredient())}
                />
                <Button type="button" onClick={handleAddIngredient} variant="outline">
                  Add
                </Button>
              </div>

              {ingredients.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {ingredients.map((ingredient) => (
                    <Badge key={ingredient} variant="secondary" className="gap-1">
                      {ingredient}
                      <X 
                        className="w-3 h-3 cursor-pointer" 
                        onClick={() => handleRemoveIngredient(ingredient)}
                      />
                    </Badge>
                  ))}
                </div>
              )}

              {detectedAllergens.length > 0 && (
                <Alert className="border-alert-danger bg-alert-danger-bg">
                  <AlertCircle className="h-4 w-4 text-alert-danger" />
                  <AlertDescription>
                    <strong>Auto-detected allergens:</strong> {detectedAllergens.join(', ')}
                    <br />
                    <span className="text-xs">⚠️ Please verify these are correct. You are responsible for accuracy.</span>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>Help people find your dish (e.g., Vegan, Italian, Spicy)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                <Button type="button" onClick={handleAddTag} variant="outline">
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <X 
                        className="w-3 h-3 cursor-pointer" 
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

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
                  <span className="text-xs">Pickup (Box)</span>
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
                      id="full_name"
                      name="identity"
                      value="full_name"
                      checked={identityReveal === 'full_name'}
                      onChange={() => setIdentityReveal('full_name')}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="full_name" className="text-sm font-normal cursor-pointer">
                      Full Name + Address
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="first_name"
                      name="identity"
                      value="first_name"
                      checked={identityReveal === 'first_name'}
                      onChange={() => setIdentityReveal('first_name')}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="first_name" className="text-sm font-normal cursor-pointer">
                      First Name Only + Address
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="last_name"
                      name="identity"
                      value="last_name"
                      checked={identityReveal === 'last_name'}
                      onChange={() => setIdentityReveal('last_name')}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="last_name" className="text-sm font-normal cursor-pointer">
                      Last Name Only + Address
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="address_only"
                      name="identity"
                      value="address_only"
                      checked={identityReveal === 'address_only'}
                      onChange={() => setIdentityReveal('address_only')}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="address_only" className="text-sm font-normal cursor-pointer">
                      Address Only (Ghost Mode - No Name)
                    </Label>
                  </div>
                </div>
              </div>

              {/* Collection Window */}
              {handoverMode !== 'ghost_mode' && (
                <div className="pt-2">
                  <Label className="text-sm font-medium mb-2 block">
                    Collection Window *
                  </Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Set a time range to avoid disruptions while cooking or eating
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
              {identityReveal === 'address_only' && (
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
                <Label htmlFor="portions">Available Portions</Label>
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
                <Label htmlFor="scheduledTime">Scheduled Time *</Label>
                <Input
                  id="scheduledTime"
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  When will your meal be ready?
                </p>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" size="lg">
            Create Meal Listing
          </Button>
        </form>
      </main>

      <BottomNav />
    </div>
  );
};

export default AddMeal;
