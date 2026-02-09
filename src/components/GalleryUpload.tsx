import { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PhotoPicker } from '@/components/PhotoPicker';

interface GalleryUploadProps {
  userId: string;
}

const GalleryUpload = ({ userId }: GalleryUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      return fileName;
    },
    onSuccess: () => {
      toast.success('Foto hochgeladen!');
      queryClient.invalidateQueries({ queryKey: ['gallery', userId] });
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error('Fehler beim Hochladen');
    },
  });

  const handlePhotoSelected = async (file: File) => {
    setUploading(true);
    await uploadImageMutation.mutateAsync(file);
    setUploading(false);
  };

  return (
    <PhotoPicker
      onPhotoSelected={handlePhotoSelected}
      bucket="gallery"
      uploadPath={userId}
      variant="outline"
      disabled={uploading}
      className="w-full"
    />
  );
};

export default GalleryUpload;
