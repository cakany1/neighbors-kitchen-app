import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Sparkles } from 'lucide-react';
import { allergenOptions, detectAllergens } from '@/utils/ingredientDatabase';
import { toast } from 'sonner';

interface TagSelectorProps {
  selectedAllergens: string[];
  onAllergensChange: (allergens: string[]) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  ingredientText?: string;
  titleText?: string;
  descriptionText?: string;
}

// Predefined taste/dietary tags (max 10 as per requirements)
const commonTags = [
  { value: 'vegan', label: 'Vegan 🌱', icon: '🌱' },
  { value: 'vegetarisch', label: 'Vegetarisch 🥗', icon: '🥗' },
  { value: 'halal', label: 'Halal ☪️', icon: '☪️' },
  { value: 'koscher', label: 'Koscher ✡️', icon: '✡️' },
  { value: 'scharf', label: 'Scharf 🌶️', icon: '🌶️' },
  { value: 'glutenfrei', label: 'Glutenfrei 🌾', icon: '🌾' },
  { value: 'laktosefrei', label: 'Laktosefrei 🥛', icon: '🥛' },
  { value: 'bio', label: 'Bio 🌿', icon: '🌿' },
  { value: 'hausgemacht', label: 'Hausgemacht 🏠', icon: '🏠' },
  { value: 'kindgerecht', label: 'Kindgerecht 🧸', icon: '🧸' },
];

// Keywords for auto-detection (DE + EN)
const tagKeywords: Record<string, string[]> = {
  vegan: ['vegan', 'pflanzlich', 'plant-based', 'plantbased', 'ohne tierische'],
  vegetarisch: ['vegetarisch', 'vegetarian', 'veggie', 'fleischlos', 'meatless'],
  halal: ['halal', 'حلال'],
  koscher: ['koscher', 'kosher', 'כשר'],
  scharf: ['scharf', 'spicy', 'hot', 'chili', 'jalapeño', 'habanero', 'sriracha', 'curry scharf', 'pikant'],
  glutenfrei: ['glutenfrei', 'gluten-free', 'glutenfree', 'ohne gluten', 'zöliakie'],
  laktosefrei: ['laktosefrei', 'lactose-free', 'lactosefree', 'ohne laktose', 'milchfrei', 'dairy-free'],
  bio: ['bio', 'organic', 'ökologisch', 'demeter', 'bioland'],
  hausgemacht: ['hausgemacht', 'homemade', 'selbstgemacht', 'handmade', 'home-made', 'eigene herstellung'],
  kindgerecht: ['kindgerecht', 'kinderfreundlich', 'kid-friendly', 'für kinder', 'familienfreundlich', 'family-friendly'],
};

/**
 * Auto-detect tags from text (title + description)
 */
function detectTagsFromText(text: string): string[] {
  const lowerText = text.toLowerCase();
  const detected: string[] = [];
  
  for (const [tag, keywords] of Object.entries(tagKeywords)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        detected.push(tag);
        break; // Found match for this tag, move to next
      }
    }
  }
  
  return detected;
}

export function TagSelector({
  selectedAllergens,
  onAllergensChange,
  selectedTags,
  onTagsChange,
  ingredientText = '',
  titleText = '',
  descriptionText = '',
}: TagSelectorProps) {
  const { t } = useTranslation();
  const [customTagInput, setCustomTagInput] = useState('');
  const [autoDetectedTags, setAutoDetectedTags] = useState<string[]>([]);
  const hasAutoDetectedRef = useRef(false);

  // Auto-detect tags from title + description
  useEffect(() => {
    const combinedText = `${titleText} ${descriptionText}`.trim();
    if (combinedText.length > 5) {
      const detected = detectTagsFromText(combinedText);
      setAutoDetectedTags(detected);
      
      // Auto-add detected tags only once per text change (to allow override)
      if (detected.length > 0 && !hasAutoDetectedRef.current) {
        const newTags = detected.filter(tag => !selectedTags.includes(tag));
        if (newTags.length > 0) {
          onTagsChange([...selectedTags, ...newTags]);
          
          const tagLabels = newTags.map(tag => {
            const option = commonTags.find(t => t.value === tag);
            return option?.label || tag;
          }).join(', ');
          
          toast.success(`Tags erkannt: ${tagLabels}`, {
            icon: <Sparkles className="w-4 h-4" />,
            duration: 3000,
          });
          hasAutoDetectedRef.current = true;
        }
      }
    }
  }, [titleText, descriptionText]);

  // Reset auto-detection flag when text changes significantly
  useEffect(() => {
    hasAutoDetectedRef.current = false;
  }, [titleText.slice(0, 10), descriptionText.slice(0, 20)]);

  // Auto-detect allergens from ingredient text
  useEffect(() => {
    if (ingredientText.trim()) {
      const ingredients = ingredientText.split(/[,\n;]+/).map(i => i.trim()).filter(Boolean);
      const detectedAllergens = detectAllergens(ingredients);
      
      const newAllergens = detectedAllergens.filter(a => !selectedAllergens.includes(a));
      
      if (newAllergens.length > 0) {
        const updatedAllergens = [...selectedAllergens, ...newAllergens];
        onAllergensChange(updatedAllergens);
        
        const allergenLabels = newAllergens.map(a => {
          const option = allergenOptions.find(opt => opt.value === a);
          return option?.label || a;
        }).join(', ');
        
        toast.success(`Allergene erkannt: ${allergenLabels}`, {
          duration: 4000,
        });
      }
    }
  }, [ingredientText]);

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
          <CardTitle>Allergene</CardTitle>
          <CardDescription>
            Wähle alle Allergene, die in deinem Gericht enthalten sind
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {allergenOptions.map((allergen) => (
              <div key={allergen.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`allergen-${allergen.value}`}
                  checked={selectedAllergens.includes(allergen.value)}
                  onCheckedChange={() => handleAllergenToggle(allergen.value)}
                />
                <Label
                  htmlFor={`allergen-${allergen.value}`}
                  className="text-sm font-normal cursor-pointer leading-tight"
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {commonTags.map((tag) => (
              <div key={tag.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`tag-${tag.value}`}
                  checked={selectedTags.includes(tag.value)}
                  onCheckedChange={() => handleTagToggle(tag.value)}
                />
                <Label
                  htmlFor={`tag-${tag.value}`}
                  className="text-sm font-normal cursor-pointer leading-tight"
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
