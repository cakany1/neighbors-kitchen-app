import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';
import { normalize, getDisplayLabel } from '@/utils/canonical_map';

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

  // Find label for a value (use i18n canonical labels)
  const getLabel = (value: string) => {
    return getDisplayLabel(value);
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
                {getDisplayLabel(opt.value)}
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
  { value: 'gluten', label: 'gluten' },
  { value: 'dairy', label: 'dairy' },
  { value: 'nuts', label: 'nuts' },
  { value: 'peanuts', label: 'peanuts' },
  { value: 'eggs', label: 'eggs' },
  { value: 'fish', label: 'fish' },
  { value: 'crustaceans', label: 'crustaceans' },
  { value: 'molluscs', label: 'molluscs' },
  { value: 'soy', label: 'soy' },
  { value: 'celery', label: 'celery' },
  { value: 'mustard', label: 'mustard' },
  { value: 'sesame', label: 'sesame' },
  { value: 'sulphites', label: 'sulphites' },
  { value: 'lupin', label: 'lupin' },
];

export const MEAL_TAG_OPTIONS: PredefinedOption[] = [
  { value: 'vegan', label: 'vegan' },
  { value: 'vegetarian', label: 'vegetarian' },
  { value: 'halal', label: 'halal' },
  { value: 'kosher', label: 'kosher' },
  { value: 'pescatarian', label: 'pescatarian' },
  { value: 'spicy', label: 'spicy' },
  { value: 'mild', label: 'mild' },
  { value: 'gluten_free', label: 'gluten_free' },
  { value: 'lactose_free', label: 'lactose_free' },
  { value: 'organic', label: 'organic' },
  { value: 'homemade', label: 'homemade' },
  { value: 'kid_friendly', label: 'kid_friendly' },
  { value: 'low_carb', label: 'low_carb' },
];

export const DISLIKE_OPTIONS: PredefinedOption[] = [
  { value: 'coriander', label: 'coriander' },
  { value: 'mushrooms', label: 'mushrooms' },
  { value: 'olives', label: 'olives' },
  { value: 'onions', label: 'onions' },
  { value: 'garlic', label: 'garlic' },
  { value: 'pork', label: 'pork' },
  { value: 'lamb', label: 'lamb' },
  { value: 'blue_cheese', label: 'blue_cheese' },
  { value: 'spicy', label: 'spicy' },
  { value: 'very_sweet', label: 'very_sweet' },
];
