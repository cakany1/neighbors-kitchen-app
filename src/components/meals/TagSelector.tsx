import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { allergenOptions } from '@/utils/ingredientDatabase';

interface TagSelectorProps {
  selectedAllergens: string[];
  onAllergensChange: (allergens: string[]) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

// Common predefined tags
const commonTags = [
  { value: 'kindgerecht', label: 'Kindgerecht 🧸', icon: '🧸' },
  { value: 'vegan', label: 'Vegan 🌱', icon: '🌱' },
  { value: 'vegetarisch', label: 'Vegetarisch 🥗', icon: '🥗' },
  { value: 'laktosefrei', label: 'Laktosefrei 🥛', icon: '🥛' },
  { value: 'glutenfrei', label: 'Glutenfrei 🌾', icon: '🌾' },
  { value: 'halal', label: 'Halal ☪️', icon: '☪️' },
  { value: 'koscher', label: 'Koscher ✡️', icon: '✡️' },
  { value: 'bio', label: 'Bio 🌿', icon: '🌿' },
  { value: 'scharf', label: 'Scharf 🌶️', icon: '🌶️' },
  { value: 'italienisch', label: 'Italienisch 🇮🇹', icon: '🇮🇹' },
  { value: 'asiatisch', label: 'Asiatisch 🥢', icon: '🥢' },
  { value: 'mediterran', label: 'Mediterran 🫒', icon: '🫒' },
];

export function TagSelector({
  selectedAllergens,
  onAllergensChange,
  selectedTags,
  onTagsChange,
}: TagSelectorProps) {
  const [customTagInput, setCustomTagInput] = useState('');

  const handleAllergenToggle = (allergenValue: string) => {
    if (selectedAllergens.includes(allergenValue)) {
      onAllergensChange(selectedAllergens.filter(a => a !== allergenValue));
    } else {
      onAllergensChange([...selectedAllergens, allergenValue]);
    }
  };

  const handleTagToggle = (tagValue: string) => {
    if (selectedTags.includes(tagValue)) {
      onTagsChange(selectedTags.filter(t => t !== tagValue));
    } else {
      onTagsChange([...selectedTags, tagValue]);
    }
  };

  const handleAddCustomTag = () => {
    const trimmedTag = customTagInput.trim();
    if (trimmedTag && !selectedTags.includes(trimmedTag)) {
      onTagsChange([...selectedTags, trimmedTag]);
      setCustomTagInput('');
    }
  };

  const handleRemoveCustomTag = (tag: string) => {
    // Only remove custom tags (not predefined ones)
    const isPredefined = commonTags.some(t => t.value === tag);
    if (!isPredefined) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      // If it's a predefined tag, just uncheck it
      handleTagToggle(tag);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section 1: Allergens */}
      <Card>
        <CardHeader>
          <CardTitle>Allergene (EU 14)</CardTitle>
          <CardDescription>
            Wähle alle Allergene, die in deinem Gericht enthalten sind
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {allergenOptions.map((allergen) => (
              <div key={allergen.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`allergen-${allergen.value}`}
                  checked={selectedAllergens.includes(allergen.value)}
                  onCheckedChange={() => handleAllergenToggle(allergen.value)}
                />
                <Label
                  htmlFor={`allergen-${allergen.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {allergen.label}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Tags / Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Tags / Kategorien</CardTitle>
          <CardDescription>
            Hilf Menschen, dein Gericht zu finden (z.B. Vegan, Italienisch)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {commonTags.map((tag) => (
              <div key={tag.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`tag-${tag.value}`}
                  checked={selectedTags.includes(tag.value)}
                  onCheckedChange={() => handleTagToggle(tag.value)}
                />
                <Label
                  htmlFor={`tag-${tag.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {tag.label}
                </Label>
              </div>
            ))}
          </div>

          {/* Section 3: Custom Input */}
          <div className="pt-4 border-t">
            <Label className="text-sm font-medium mb-2 block">Anderes hinzufügen</Label>
            <div className="flex gap-2">
              <Input
                placeholder="➕ Eigenes Tag hinzufügen..."
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomTag();
                  }
                }}
              />
              <Button type="button" onClick={handleAddCustomTag} variant="outline">
                Hinzufügen
              </Button>
            </div>

            {/* Display custom tags as removable badges */}
            {selectedTags.filter(tag => !commonTags.some(t => t.value === tag)).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedTags
                  .filter(tag => !commonTags.some(t => t.value === tag))
                  .map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => handleRemoveCustomTag(tag)}
                      />
                    </Badge>
                  ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
