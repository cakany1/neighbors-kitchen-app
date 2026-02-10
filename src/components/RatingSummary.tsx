import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export interface ProfileRatingsData {
  user_id: string;
  chef_total: number;
  chef_avg: number;
  guest_total: number;
  guest_avg: number;
}

interface RatingSummaryProps {
  userId: string;
  role?: 'chef' | 'guest';
  size?: 'sm' | 'md';
  showLabel?: boolean;
  /** Pre-loaded summary – skips internal query when provided */
  summary?: ProfileRatingsData | null;
}

const formatRatingCount = (count: number, locale: string): string => {
  if (count === 0) return '';
  if (count >= 1000) {
    const thousands = Math.floor(count / 1000);
    const apostrophe = locale === 'de' ? "'" : ',';
    return `${thousands}${apostrophe}000+`;
  }
  return count.toString();
};

export const RatingSummary = ({
  userId,
  role = 'chef',
  size = 'md',
  showLabel = true,
  summary,
}: RatingSummaryProps) => {
  const { t, i18n } = useTranslation();

  const { data: fetchedRatings } = useQuery({
    queryKey: ['ratingsSummary', userId],
    queryFn: async (): Promise<ProfileRatingsData | null> => {
      const supabaseAny = supabase as any;
      const { data, error } = await supabaseAny
        .from('profile_ratings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching ratings:', error);
        return null;
      }

      return data as ProfileRatingsData;
    },
    enabled: !!userId && summary === undefined,
  });

  const ratings = summary !== undefined ? summary : fetchedRatings;

  const isChef = role === 'chef';
  const total = isChef ? Number(ratings?.chef_total) || 0 : Number(ratings?.guest_total) || 0;
  const avg = isChef ? Number(ratings?.chef_avg) || 0 : Number(ratings?.guest_avg) || 0;

  if (total === 0) {
    return (
      <span className={`inline-flex items-center gap-1 ${size === 'sm' ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
        {t('ratings.new', 'Neu')}
      </span>
    );
  }

  const formattedCount = formatRatingCount(total, i18n.language);
  const sizeClasses = size === 'sm' ? 'w-3 h-3 text-xs' : 'w-4 h-4 text-sm';

  return (
    <span className={`inline-flex items-center gap-1 ${size === 'sm' ? 'text-xs' : 'text-sm'} font-medium text-foreground`}>
      <Star className={`${sizeClasses} fill-yellow-400 text-yellow-400`} />
      <span>{avg.toFixed(1)}</span>
      {formattedCount && <span className="text-muted-foreground">({formattedCount})</span>}
      {showLabel && (
        <span className="text-muted-foreground">
          {t('ratings.reviews', 'Bewertungen')}
        </span>
      )}
    </span>
  );
};

export default RatingSummary;
