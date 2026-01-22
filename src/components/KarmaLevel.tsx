import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';

interface KarmaLevelProps {
  karma: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const getKarmaLevel = (karma: number) => {
  if (karma >= 2000) return { level: 5, key: 'star_chef', icon: '⭐', color: 'bg-yellow-500' };
  if (karma >= 1000) return { level: 4, key: 'head_chef', icon: '👨‍🍳✨', color: 'bg-purple-500' };
  if (karma >= 500) return { level: 3, key: 'sous_chef', icon: '👨‍🍳', color: 'bg-blue-500' };
  if (karma >= 200) return { level: 2, key: 'apprentice', icon: '🧑‍🍳', color: 'bg-green-500' };
  return { level: 1, key: 'intern', icon: '👶', color: 'bg-gray-400' };
};

export const KarmaLevel = ({ karma, showLabel = true, size = 'md' }: KarmaLevelProps) => {
  const { t } = useTranslation();
  const level = getKarmaLevel(karma);
  
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
    <Badge 
      variant="secondary" 
      className={`${level.color} text-white font-medium ${sizeClasses[size]} inline-flex items-center gap-1.5`}
    >
      <span className={iconSizes[size]}>{level.icon}</span>
      {showLabel && (
        <span>{t(`karma_levels.${level.key}`)}</span>
      )}
    </Badge>
  );
};
