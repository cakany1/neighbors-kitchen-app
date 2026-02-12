import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { TagPicker, ALLERGEN_OPTIONS, MEAL_TAG_OPTIONS, normalizeTag } from '@/components/TagPicker';
import { detectAllergens } from '@/utils/ingredientDatabase';

interface TagSelectorProps {
  selectedAllergens: string[];
  onAllergensChange: (allergens: string[]) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  ingredientText?: string;
  titleText?: string;
  descriptionText?: string;
}

// Keywords for auto-detection (DE + EN)
const tagKeywords: Record<string, string[]> = {
  vegan: ['vegan', 'pflanzlich', 'plant-based', 'plantbased', 'ohne tierische'],
  vegetarian: ['vegetarisch', 'vegetarian', 'veggie', 'fleischlos', 'meatless'],
  halal: ['halal', 'حلال'],
  kosher: ['koscher', 'kosher', 'כשר'],
  spicy: ['scharf', 'spicy', 'hot', 'chili', 'jalapeño', 'habanero', 'sriracha', 'curry scharf', 'pikant'],
  gluten_free: ['glutenfrei', 'gluten-free', 'glutenfree', 'ohne gluten', 'zöliakie'],
  lactose_free: ['laktosefrei', 'lactose-free', 'lactosefree', 'ohne laktose', 'milchfrei', 'dairy-free'],
  organic: ['bio', 'organic', 'ökologisch', 'demeter', 'bioland'],
  homemade: ['hausgemacht', 'homemade', 'selbstgemacht', 'handmade', 'home-made', 'eigene herstellung'],
  kid_friendly: ['kindgerecht', 'kinderfreundlich', 'kid-friendly', 'für kinder', 'familienfreundlich', 'family-friendly'],
};

function detectTagsFromText(text: string): string[] {
  const lowerText = text.toLowerCase();
  const detected: string[] = [];
  for (const [tag, keywords] of Object.entries(tagKeywords)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        detected.push(tag);
        break;
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
  const [autoDetectedTags, setAutoDetectedTags] = useState<string[]>([]);
  const hasAutoDetectedRef = useRef(false);

  // Auto-detect tags from title + description
  useEffect(() => {
    const combinedText = `${titleText} ${descriptionText}`.trim();
    if (combinedText.length > 5) {
      const detected = detectTagsFromText(combinedText);
      setAutoDetectedTags(detected);

      if (detected.length > 0 && !hasAutoDetectedRef.current) {
        const newTags = detected.filter(tag => !selectedTags.includes(tag));
        if (newTags.length > 0) {
          onTagsChange([...selectedTags, ...newTags]);
          const tagLabels = newTags.map(tag => {
            const option = MEAL_TAG_OPTIONS.find(t => t.value === tag);
            return option?.label || tag;
          }).join(', ');
          toast.success(t('toast.tags_detected', { tags: tagLabels }), {
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
        onAllergensChange([...selectedAllergens, ...newAllergens]);
        const labels = newAllergens.map(a => {
          const opt = ALLERGEN_OPTIONS.find(o => o.value === a);
          return opt?.label || a;
        }).join(', ');
        toast.success(t('toast.allergens_detected', { allergens: labels }), { duration: 4000 });
      }
    }
  }, [ingredientText]);

  return (
    <div className="space-y-6">
      {/* Allergens */}
      <Card>
        <CardHeader>
          <CardTitle>Allergene</CardTitle>
          <CardDescription>
            Wähle alle Allergene, die in deinem Gericht enthalten sind
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TagPicker
            predefinedOptions={ALLERGEN_OPTIONS}
            selected={selectedAllergens}
            onChange={onAllergensChange}
            allowCustom
            placeholder="Weiteres Allergen..."
            badgeVariant="destructive"
          />
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Tags / Kategorien</CardTitle>
          <CardDescription>
            Hilf Menschen, dein Gericht zu finden (z.B. Vegan, Halal)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TagPicker
            predefinedOptions={MEAL_TAG_OPTIONS}
            selected={selectedTags}
            onChange={onTagsChange}
            allowCustom
            placeholder="➕ Eigenes Tag..."
            normalizeFn={normalizeTag}
          />
        </CardContent>
      </Card>
    </div>
  );
}
