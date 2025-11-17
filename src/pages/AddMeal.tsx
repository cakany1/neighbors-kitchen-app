import { useState } from 'react';
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
import { Upload, ChefHat, X } from 'lucide-react';
import { toast } from 'sonner';

const AddMeal = () => {
  const navigate = useNavigate();
  const [isCookingExperience, setIsCookingExperience] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    minimumPrice: '',
    portions: '',
    allergens: '',
    scheduledDate: '',
    scheduledTime: '',
  });

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.scheduledDate || !formData.scheduledTime) {
      toast.error('Please fill in all required fields including date and time');
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

              <div>
                <Label htmlFor="allergens">Allergens (optional)</Label>
                <Input
                  id="allergens"
                  placeholder="e.g., Peanuts, Gluten, Dairy"
                  value={formData.allergens}
                  onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                />
              </div>
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

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing - Pay What You Want</CardTitle>
              <CardDescription>Set a minimum price (can be 0 for free sharing)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div>
                <Label htmlFor="portions">Available Portions</Label>
                <Input
                  id="portions"
                  type="number"
                  min="1"
                  placeholder="4"
                  value={formData.portions}
                  onChange={(e) => setFormData({ ...formData, portions: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Scheduling */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule Your Meal</CardTitle>
              <CardDescription>When will this meal be available?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="scheduledDate">Date *</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="scheduledTime">Time *</Label>
                <Input
                  id="scheduledTime"
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                  required
                />
              </div>

              <p className="text-sm text-muted-foreground">
                📅 Schedule your meal in advance! Planning to cook something special this Saturday? Let your neighbors know now.
              </p>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="w-full h-14 text-lg">
            Create Meal Listing
          </Button>
        </form>
      </main>

      <BottomNav />
    </div>
  );
};

export default AddMeal;
