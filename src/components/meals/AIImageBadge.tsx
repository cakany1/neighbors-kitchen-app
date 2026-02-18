import { useTranslation } from 'react-i18next';
import { AlertTriangle, Sparkles, Camera } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AIImageBadgeProps {
  variant?: 'overlay' | 'inline' | 'corner';
  showRealPhotoBadge?: boolean;
}

/**
 * Badge to indicate AI-generated images with expectation management
 * 
 * Variants:
 * - overlay: Full-width overlay at bottom of image (for detail pages)
 * - inline: Compact inline badge (for cards)
 * - corner: Small corner badge (minimal)
 */
export const AIImageBadge = ({ variant = 'inline', showRealPhotoBadge = false }: AIImageBadgeProps) => {
  const { t } = useTranslation();

  if (showRealPhotoBadge) {
    // Real photo badge - higher trust indicator
    return (
      <Badge 
        variant="secondary" 
        className="bg-green-500/90 text-white border-0 flex items-center gap-1"
      >
        <Camera className="w-3 h-3" />
        {t('meal.real_photo_badge')}
      </Badge>
    );
  }

  if (variant === 'overlay') {
    return (
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
        <div className="flex items-center gap-2 text-white">
          <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
          <span className="text-xs font-medium">
            {t('meal.ai_disclaimer')}
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'corner') {
    return (
      <div className="absolute top-2 left-2 bg-amber-500/90 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
        <Sparkles className="w-3 h-3" />
        {t('meal.ai_badge_short')}
      </div>
    );
  }

  // Default: inline variant
  return (
    <Badge 
      variant="secondary" 
      className="bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30 flex items-center gap-1"
    >
      <Sparkles className="w-3 h-3" />
      {t('meal.ai_preview_badge')}
    </Badge>
  );
};
