import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface GalleryGridProps {
  userId: string;
  isOwnProfile: boolean;
}

const GalleryGrid = ({ userId, isOwnProfile }: GalleryGridProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Fetch gallery images
  const { data: images = [], isLoading } = useQuery({
    queryKey: ['gallery', userId],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from('gallery')
        .list(userId, {
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) throw error;

      // Filter out avatar images - only show food photos
      // Avatar files start with "avatar-" and should not appear in the food gallery
      const foodPhotos = data.filter((file) => !file.name.startsWith('avatar-'));

      // Get public URLs for each food image
      const imageUrls = foodPhotos.map((file) => {
        const { data: { publicUrl } } = supabase.storage
          .from('gallery')
          .getPublicUrl(`${userId}/${file.name}`);
        
        return {
          name: file.name,
          url: publicUrl,
          path: `${userId}/${file.name}`,
        };
      });

      return imageUrls;
    },
  });

  // Delete image mutation
  const deleteImageMutation = useMutation({
    mutationFn: async (path: string) => {
      const { error } = await supabase.storage
        .from('gallery')
        .remove([path]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t('toast.photo_deleted'));
      queryClient.invalidateQueries({ queryKey: ['gallery', userId] });
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error(t('toast.delete_failed'));
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {isOwnProfile ? 'Noch keine Fotos hochgeladen' : 'Keine Galerie verfügbar'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {images.map((image) => (
        <div key={image.path} className="relative aspect-square group">
          <img
            src={image.url}
            alt="Gallery"
            className="w-full h-full object-cover rounded-lg"
          />
          {isOwnProfile && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => deleteImageMutation.mutate(image.path)}
              disabled={deleteImageMutation.isPending}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};

export default GalleryGrid;
