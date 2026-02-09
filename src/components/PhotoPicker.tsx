import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Camera, Image, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';

// Constants for validation
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

interface PhotoPickerProps {
  onPhotoSelected: (file: File, previewUrl: string) => void;
  onUploadComplete?: (publicUrl: string) => void;
  bucket: 'avatars' | 'gallery' | 'id-documents';
  uploadPath?: string; // e.g., userId/avatar or userId/meal-123
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  label?: string;
  disabled?: boolean;
  autoUpload?: boolean; // If true, uploads immediately after selection
  className?: string;
}

export function PhotoPicker({
  onPhotoSelected,
  onUploadComplete,
  bucket,
  uploadPath,
  variant = 'default',
  size = 'default',
  label,
  disabled = false,
  autoUpload = false,
  className,
}: PhotoPickerProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [isUploading, setIsUploading] = useState(false);
  
  // Refs for different input modes
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error(t('profile.file_too_large', 'File too large (max 5MB)'));
      return false;
    }

    // Check file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error(t('profile.images_only', 'Only JPEG, PNG, WebP or GIF allowed'));
      return false;
    }

    return true;
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!uploadPath) {
      console.error('[PhotoPicker] uploadPath required for auto-upload');
      return null;
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${uploadPath}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      console.error('[PhotoPicker] Upload error:', uploadError);
      toast.error(t('toast.upload_failed', 'Upload failed'));
      return null;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    // Add cache-busting timestamp
    return `${data.publicUrl}?t=${Date.now()}`;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input
    e.target.value = '';

    // Validate
    if (!validateFile(file)) return;

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    
    // Notify parent of selection
    onPhotoSelected(file, previewUrl);

    // Auto-upload if enabled
    if (autoUpload && uploadPath) {
      setIsUploading(true);
      const publicUrl = await uploadFile(file);
      setIsUploading(false);

      if (publicUrl && onUploadComplete) {
        onUploadComplete(publicUrl);
        toast.success(t('toast.photo_uploaded', 'Photo uploaded!'));
      }
    }
  };

  const triggerCamera = () => {
    cameraInputRef.current?.click();
  };

  const triggerGallery = () => {
    galleryInputRef.current?.click();
  };

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  const buttonLabel = label || t('photo_picker.upload_photo', 'Upload Photo');

  return (
    <>
      {/* Hidden inputs for different capture modes */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {isMobile ? (
        // Mobile: Show dropdown with camera/gallery options
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant={variant} 
              size={size} 
              disabled={disabled || isUploading}
              className={className}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('common.loading', 'Loading...')}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {buttonLabel}
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-48">
            <DropdownMenuItem onClick={triggerCamera} className="cursor-pointer">
              <Camera className="w-4 h-4 mr-2" />
              {t('photo_picker.take_photo', 'Take Photo')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={triggerGallery} className="cursor-pointer">
              <Image className="w-4 h-4 mr-2" />
              {t('photo_picker.choose_from_gallery', 'Choose from Gallery')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        // Desktop: Simple file picker button
        <Button
          variant={variant}
          size={size}
          disabled={disabled || isUploading}
          onClick={triggerGallery}
          className={className}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('common.loading', 'Loading...')}
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              {buttonLabel}
            </>
          )}
        </Button>
      )}
    </>
  );
}

export default PhotoPicker;
