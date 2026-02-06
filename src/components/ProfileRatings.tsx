import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Utensils, UtensilsCrossed, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface ProfileRatingsProps {
  userId: string;
  compact?: boolean;
}

interface RatingData {
  total: number;
  avg: number;
  distribution: number[];
}

// Spoon icon for chef ratings
const SpoonIcon = ({ className }: { className?: string }) => (
  <Utensils className={className} />
);

// Plate icon for guest ratings  
const PlateIcon = ({ className }: { className?: string }) => (
  <UtensilsCrossed className={className} />
);

const RatingBar = ({ 
  stars, 
  count, 
  total 
}: { 
  stars: number; 
  count: number; 
  total: number;
}) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  
  return (
    <div className="flex items-center gap-2 text-xs group cursor-default">
      <span className="w-8 text-muted-foreground flex items-center gap-0.5">
        {stars} <Star className="w-3 h-3 fill-current" />
      </span>
      <div className="flex-1 h-3 bg-muted rounded-sm overflow-hidden">
        <div 
          className="h-full bg-yellow-400 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-10 text-right text-muted-foreground">
        {percentage}%
      </span>
    </div>
  );
};

const RatingSection = ({
  title,
  icon: Icon,
  data,
  iconColor,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  data: RatingData;
  iconColor: string;
}) => {
  const { t } = useTranslation();
  
  if (data.total === 0) {
    return (
      <div className="flex-1 min-w-[160px]">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`w-4 h-4 ${iconColor}`} />
          <span className="text-sm font-medium">{title}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('ratings.no_ratings_yet', 'Noch keine Bewertungen')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-[160px]">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <span className="text-sm font-medium">{title}</span>
      </div>
      
      {/* Average display - Amazon style */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star 
              key={star}
              className={`w-4 h-4 ${
                star <= Math.round(data.avg) 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'fill-muted text-muted'
              }`}
            />
          ))}
        </div>
        <span className="text-lg font-bold">{data.avg.toFixed(1)}</span>
        <span className="text-xs text-muted-foreground">
          ({data.total} {data.total === 1 
            ? t('ratings.review', 'Bewertung') 
            : t('ratings.reviews', 'Bewertungen')})
        </span>
      </div>

      {/* Distribution bars */}
      <div className="space-y-1.5">
        {[5, 4, 3, 2, 1].map((stars) => (
          <RatingBar 
            key={stars} 
            stars={stars} 
            count={data.distribution[5 - stars]} 
            total={data.total} 
          />
        ))}
      </div>
    </div>
  );
};

interface ProfileRatingsData {
  user_id: string;
  chef_total: number;
  chef_avg: number;
  chef_stars_5: number;
  chef_stars_4: number;
  chef_stars_3: number;
  chef_stars_2: number;
  chef_stars_1: number;
  guest_total: number;
  guest_avg: number;
  guest_stars_5: number;
  guest_stars_4: number;
  guest_stars_3: number;
  guest_stars_2: number;
  guest_stars_1: number;
}

export const ProfileRatings = ({ userId, compact = false }: ProfileRatingsProps) => {
  const { t } = useTranslation();

  const { data: ratings, isLoading } = useQuery({
    queryKey: ['profileRatings', userId],
    queryFn: async (): Promise<ProfileRatingsData | null> => {
      // Use type assertion to query the view
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
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-4">
          <div className="animate-pulse flex gap-6">
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-20" />
              <div className="h-8 bg-muted rounded w-16" />
              <div className="space-y-1.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-3 bg-muted rounded" />
                ))}
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-20" />
              <div className="h-8 bg-muted rounded w-16" />
              <div className="space-y-1.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-3 bg-muted rounded" />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chefData: RatingData = {
    total: Number(ratings?.chef_total) || 0,
    avg: Number(ratings?.chef_avg) || 0,
    distribution: [
      Number(ratings?.chef_stars_5) || 0,
      Number(ratings?.chef_stars_4) || 0,
      Number(ratings?.chef_stars_3) || 0,
      Number(ratings?.chef_stars_2) || 0,
      Number(ratings?.chef_stars_1) || 0,
    ],
  };

  const guestData: RatingData = {
    total: Number(ratings?.guest_total) || 0,
    avg: Number(ratings?.guest_avg) || 0,
    distribution: [
      Number(ratings?.guest_stars_5) || 0,
      Number(ratings?.guest_stars_4) || 0,
      Number(ratings?.guest_stars_3) || 0,
      Number(ratings?.guest_stars_2) || 0,
      Number(ratings?.guest_stars_1) || 0,
    ],
  };

  // Don't show card if no ratings at all
  if (chefData.total === 0 && guestData.total === 0) {
    if (compact) return null;
    
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            {t('ratings.title', 'Bewertungen')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t('ratings.no_ratings_yet', 'Noch keine Bewertungen')}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    // Compact view for ChefProfile - just show averages with stars
    return (
      <div className="flex items-center gap-4 text-sm">
        {chefData.total > 0 && (
          <div className="flex items-center gap-1.5">
            <SpoonIcon className="w-4 h-4 text-amber-500" />
            <div className="flex items-center">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="font-bold ml-0.5">{chefData.avg.toFixed(1)}</span>
            </div>
            <span className="text-muted-foreground">({chefData.total})</span>
          </div>
        )}
        {guestData.total > 0 && (
          <div className="flex items-center gap-1.5">
            <PlateIcon className="w-4 h-4 text-blue-500" />
            <div className="flex items-center">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="font-bold ml-0.5">{guestData.avg.toFixed(1)}</span>
            </div>
            <span className="text-muted-foreground">({guestData.total})</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">
          {t('ratings.title', 'Bewertungen')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-6">
          <RatingSection
            title={t('ratings.as_chef', 'Als Koch')}
            icon={SpoonIcon}
            data={chefData}
            iconColor="text-amber-500"
          />
          <RatingSection
            title={t('ratings.as_guest', 'Als Gast')}
            icon={PlateIcon}
            data={guestData}
            iconColor="text-blue-500"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileRatings;
