import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';
import { normalize } from '@/utils/canonical_map';

/** Re-export normalize as normalizeTag for backward compatibility */
export const normalizeTag = normalize;

export interface PredefinedOption {
  value: string;
  label: string;
}

interface TagPickerProps {
  /** Chips shown as clickable presets */
  predefinedOptions: PredefinedOption[];
  /** Currently selected values (canonical/normalized) */
  selected: string[];
  /** Callback when selection changes */
  onChange: (next: string[]) => void;
  /** Allow free-text custom entries */
  allowCustom?: boolean;
  /** Input placeholder */
  placeholder?: string;
  /** Custom normalize function (defaults to built-in normalizeTag) */
  normalizeFn?: (s: string) => string;
  /** Visual variant for badges */
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  /** Whether the picker is in read-only mode */
  readOnly?: boolean;
  /** Label displayed above the "none" message */
  emptyText?: string;
}

export function TagPicker({
  predefinedOptions,
  selected,
  onChange,
  allowCustom = true,
  placeholder = 'Hinzufügen...',
  normalizeFn = normalizeTag,
  badgeVariant = 'secondary',
  readOnly = false,
  emptyText = 'Keine',
}: TagPickerProps) {
  const [customInput, setCustomInput] = useState('');

  const toggle = (value: string) => {
    if (readOnly) return;
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const addCustom = () => {
    if (!customInput.trim()) return;
    const normalized = normalizeFn(customInput);
    if (!selected.includes(normalized)) {
      onChange([...selected, normalized]);
    }
    setCustomInput('');
  };

  const remove = (value: string) => {
    if (readOnly) return;
    onChange(selected.filter((v) => v !== value));
  };

  // Find label for a value (from predefined or use raw value)
  const getLabel = (value: string) => {
    const opt = predefinedOptions.find((o) => o.value === value);
    return opt?.label ?? value;
  };

  // Split selected into predefined vs custom
  const predefinedValues = new Set(predefinedOptions.map((o) => o.value));
  const customSelected = selected.filter((v) => !predefinedValues.has(v));

  return (
    <div className="space-y-3">
      {/* Predefined chips */}
      {!readOnly && (
        <div className="flex flex-wrap gap-1.5">
          {predefinedOptions.map((opt) => {
            const isSelected = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                className={`
                  inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border transition-colors
                  ${isSelected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                  }
                `}
              >
                {opt.label}
                {isSelected && <X className="w-3 h-3 ml-0.5" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Selected badges (read-only mode shows all, edit mode shows only custom) */}
      {readOnly && (
        <div className="flex flex-wrap gap-1">
          {selected.length === 0 && (
            <p className="text-sm text-muted-foreground">{emptyText}</p>
          )}
          {selected.map((v) => (
            <Badge key={v} variant={badgeVariant} className="text-xs">
              {getLabel(v)}
            </Badge>
          ))}
        </div>
      )}

      {/* Custom selected chips (edit mode) */}
      {!readOnly && customSelected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {customSelected.map((v) => (
            <Badge key={v} variant={badgeVariant} className="text-xs gap-1">
              {v}
              <X className="w-3 h-3 cursor-pointer" onClick={() => remove(v)} />
            </Badge>
          ))}
        </div>
      )}

      {/* Custom input */}
      {!readOnly && allowCustom && (
        <div className="flex gap-2">
          <Input
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder={placeholder}
            className="text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustom();
              }
            }}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={addCustom}
            className="shrink-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Canonical predefined lists ───────────────────────────────

export const ALLERGEN_OPTIONS: PredefinedOption[] = [
  { value: 'gluten', label: 'Gluten 🌾' },
  { value: 'dairy', label: 'Milch / Laktose 🥛' },
  { value: 'nuts', label: 'Nüsse 🥜' },
  { value: 'peanuts', label: 'Erdnüsse 🥜' },
  { value: 'eggs', label: 'Eier 🥚' },
  { value: 'fish', label: 'Fisch 🐟' },
  { value: 'crustaceans', label: 'Krebstiere 🦐' },
  { value: 'molluscs', label: 'Weichtiere 🦑' },
  { value: 'soy', label: 'Soja' },
  { value: 'celery', label: 'Sellerie' },
  { value: 'mustard', label: 'Senf' },
  { value: 'sesame', label: 'Sesam' },
  { value: 'sulphites', label: 'Sulfite' },
  { value: 'lupin', label: 'Lupinen' },
];

export const MEAL_TAG_OPTIONS: PredefinedOption[] = [
  { value: 'vegan', label: 'Vegan 🌱' },
  { value: 'vegetarian', label: 'Vegetarisch 🥗' },
  { value: 'halal', label: 'Halal ☪️' },
  { value: 'kosher', label: 'Koscher ✡️' },
  { value: 'pescatarian', label: 'Pescatarisch 🐟' },
  { value: 'spicy', label: 'Scharf 🌶️' },
  { value: 'mild', label: 'Mild 😊' },
  { value: 'gluten_free', label: 'Glutenfrei 🌾' },
  { value: 'lactose_free', label: 'Laktosefrei 🥛' },
  { value: 'organic', label: 'Bio 🌿' },
  { value: 'homemade', label: 'Hausgemacht 🏠' },
  { value: 'kid_friendly', label: 'Kindgerecht 🧸' },
  { value: 'low_carb', label: 'Low Carb 💪' },
];

export const DISLIKE_OPTIONS: PredefinedOption[] = [
  { value: 'coriander', label: 'Koriander' },
  { value: 'mushrooms', label: 'Pilze 🍄' },
  { value: 'olives', label: 'Oliven' },
  { value: 'onions', label: 'Zwiebeln 🧅' },
  { value: 'garlic', label: 'Knoblauch 🧄' },
  { value: 'pork', label: 'Schweinefleisch 🐷' },
  { value: 'lamb', label: 'Lamm 🐑' },
  { value: 'blue_cheese', label: 'Blauschimmelkäse' },
  { value: 'spicy', label: 'Scharf 🌶️' },
  { value: 'very_sweet', label: 'Sehr süss 🍬' },
];
