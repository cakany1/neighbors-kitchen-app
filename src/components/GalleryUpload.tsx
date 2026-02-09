import { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Constants for validation
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

interface GalleryUploadProps {
  userId: string;
}

const GalleryUpload = ({ userId }: GalleryUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      // Upload to storage
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`Datei zu gross (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`);
      return;
    }

    // Validate file type - strict whitelist
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Nur JPEG, PNG, WebP oder GIF erlaubt');
      return;
    }

    setUploading(true);
    await uploadImageMutation.mutateAsync(file);
    setUploading(false);
    
    // Reset input
    e.target.value = '';
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        disabled={uploading}
        className="hidden"
        id="gallery-upload"
      />
      <label htmlFor="gallery-upload">
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          className="w-full"
          asChild
        >
          <span className="cursor-pointer">
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Lädt hoch...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Foto hochladen
              </>
            )}
          </span>
        </Button>
      </label>
    </div>
  );
};

export default GalleryUpload;
