import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface KarmaLevelProps {
  karma: number;
  showLabel?: boolean;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const KARMA_THRESHOLDS = [
  { level: 1, key: 'intern', icon: '👶', color: 'bg-gray-400', min: 0, max: 199 },
  { level: 2, key: 'apprentice', icon: '🧑‍🍳', color: 'bg-green-500', min: 200, max: 499 },
  { level: 3, key: 'sous_chef', icon: '👨‍🍳', color: 'bg-blue-500', min: 500, max: 999 },
  { level: 4, key: 'head_chef', icon: '👨‍🍳✨', color: 'bg-purple-500', min: 1000, max: 1999 },
  { level: 5, key: 'star_chef', icon: '⭐', color: 'bg-yellow-500', min: 2000, max: Infinity },
];

export const getKarmaLevel = (karma: number) => {
  if (karma >= 2000) return { level: 5, key: 'star_chef', icon: '⭐', color: 'bg-yellow-500' };
  if (karma >= 1000) return { level: 4, key: 'head_chef', icon: '👨‍🍳✨', color: 'bg-purple-500' };
  if (karma >= 500) return { level: 3, key: 'sous_chef', icon: '👨‍🍳', color: 'bg-blue-500' };
  if (karma >= 200) return { level: 2, key: 'apprentice', icon: '🧑‍🍳', color: 'bg-green-500' };
  return { level: 1, key: 'intern', icon: '👶', color: 'bg-gray-400' };
};

export const getKarmaProgress = (karma: number) => {
  const currentLevel = KARMA_THRESHOLDS.find(t => karma >= t.min && karma <= t.max) || KARMA_THRESHOLDS[0];
  const nextLevel = KARMA_THRESHOLDS.find(t => t.level === currentLevel.level + 1);
  
  if (!nextLevel) {
    // Max level reached
    return { progress: 100, pointsToNext: 0, nextLevelKey: null };
  }
  
  const pointsInCurrentLevel = karma - currentLevel.min;
  const pointsNeededForNextLevel = nextLevel.min - currentLevel.min;
  const progress = Math.min(100, (pointsInCurrentLevel / pointsNeededForNextLevel) * 100);
  const pointsToNext = nextLevel.min - karma;
  
  return { progress, pointsToNext, nextLevelKey: nextLevel.key };
};

export const KarmaLevel = ({ karma, showLabel = true, showProgress = false, size = 'md' }: KarmaLevelProps) => {
  const { t } = useTranslation();
  const level = getKarmaLevel(karma);
  const progressInfo = getKarmaProgress(karma);
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };
  
  const iconSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <div className="space-y-2">
      <Badge 
        variant="secondary" 
        className={`${level.color} text-white font-medium ${sizeClasses[size]} inline-flex items-center gap-1.5`}
      >
        <span className={iconSizes[size]}>{level.icon}</span>
        {showLabel && (
          <span>{t(`karma_levels.${level.key}`)}</span>
        )}
      </Badge>
      
      {showProgress && progressInfo.nextLevelKey && (
        <div className="space-y-1">
          <Progress value={progressInfo.progress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {t('karma_levels.points_to_next', { 
              points: progressInfo.pointsToNext, 
              level: t(`karma_levels.${progressInfo.nextLevelKey}`) 
            })}
          </p>
        </div>
      )}
      
      {showProgress && !progressInfo.nextLevelKey && (
        <p className="text-xs text-muted-foreground">
          {t('karma_levels.max_level_reached')}
        </p>
      )}
    </div>
  );
};
