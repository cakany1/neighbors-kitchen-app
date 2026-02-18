import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2, Camera, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AIImageGeneratorProps {
  title: string;
  description: string;
  ingredients?: string;
  onImageGenerated: (imageUrl: string) => void;
  onConfirmationChange: (confirmed: boolean) => void;
  isConfirmed: boolean;
  currentImageUrl?: string;
  isAIImage?: boolean;
}

export const AIImageGenerator = ({
  title,
  description,
  ingredients,
  onImageGenerated,
  onConfirmationChange,
  isConfirmed,
  currentImageUrl,
  isAIImage,
}: AIImageGeneratorProps) => {
  const { t } = useTranslation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  const generateAIImage = async () => {
    if (!title.trim()) {
      toast.error(t('ai.title_required'));
      return;
    }

    setIsGenerating(true);
    
    try {
      // Build a detailed prompt for food photography
      const ingredientList = ingredients?.trim() || '';
      const prompt = `Professional food photography of "${title}". ${description ? `Description: ${description}.` : ''} ${ingredientList ? `Ingredients: ${ingredientList}.` : ''} Style: overhead shot on a rustic wooden table with natural lighting, appetizing presentation, home-cooked meal aesthetic. High quality, photorealistic.`;

      const { data, error } = await supabase.functions.invoke('generate-meal-image', {
        body: { prompt }
      });

      // supabase.functions.invoke returns non-2xx bodies in `data` with error set
      if (error) {
        console.error('AI image generation error:', error);
        
        // Check the error context for HTTP status or message hints
        const errorMsg = error.message || '';
        const errorContext = (error as any)?.context;
        const status = errorContext?.status || 0;
        
        if (status === 429 || errorMsg.includes('429') || errorMsg.includes('rate limit')) {
          toast.error(t('ai.rate_limit'));
        } else if (status === 402 || errorMsg.includes('402') || errorMsg.includes('quota')) {
          toast.error(t('ai.quota_exhausted'));
        } else if (status === 401 || status === 403 || errorMsg.includes('401')) {
          toast.error(t('ai.auth_error'));
        } else if (errorMsg.includes('timeout') || errorMsg.includes('Timeout')) {
          toast.error(t('ai.timeout'));
        } else {
          toast.error(t('ai.generation_failed'));
        }
        return;
      }

      // Edge function may return error in JSON body (non-throw path)
      if (data?.error) {
        console.error('AI image generation returned error:', data.error);
        if (data.error === 'rate_limit') {
          toast.error(t('ai.rate_limit'));
        } else if (data.error === 'quota_exhausted') {
          toast.error(t('ai.quota_exhausted'));
        } else {
          toast.error(data.message || t('ai.generation_failed'));
        }
        return;
      }

      if (data?.imageUrl) {
        setGeneratedImageUrl(data.imageUrl);
        onImageGenerated(data.imageUrl);
        toast.success(t('ai.preview_generated'));
      } else {
        toast.error(t('ai.no_image'));
      }
    } catch (error) {
      console.error('Failed to generate AI image:', error);
      // Network errors, timeouts
      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.error(t('ai.network_error'));
      } else {
        toast.error(t('ai.generation_failed'));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const displayImageUrl = generatedImageUrl || currentImageUrl;
  const showAIBadge = isAIImage || generatedImageUrl;

  return (
    <div className="space-y-4">
      {/* AI Image Preview */}
      {displayImageUrl && showAIBadge && (
        <div className="relative rounded-lg overflow-hidden border border-border">
          <img 
            src={displayImageUrl} 
            alt={title || 'AI Preview'} 
            className="w-full h-48 object-cover"
          />
          {/* AI Image Badge - Expectation Management */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            <div className="flex items-center gap-2 text-white">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-medium">
                {t('ai.preview_disclaimer')}
              </span>
            </div>
          </div>
          {/* Sparkles badge in corner */}
          <div className="absolute top-2 right-2 bg-primary/90 text-primary-foreground px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            KI
          </div>
        </div>
      )}

      {/* Generate Button */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-14 flex items-center justify-center gap-2 border-dashed border-2 hover:border-primary hover:bg-primary/5"
        onClick={generateAIImage}
        disabled={isGenerating || !title.trim()}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{t('ai.generating')}</span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            <span>{t('ai.generate_button')}</span>
          </>
        )}
      </Button>

      {/* Info Alert */}
      <Alert className="border-amber-500/50 bg-amber-500/10">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <AlertDescription className="text-sm">
          {t('ai.info_alert')}
        </AlertDescription>
      </Alert>

      {/* Confirmation Checkbox - Required before publish */}
      {showAIBadge && (
        <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
          <Checkbox
            id="ai-confirm"
            checked={isConfirmed}
            onCheckedChange={(checked) => onConfirmationChange(checked === true)}
            className="mt-0.5"
          />
          <Label htmlFor="ai-confirm" className="text-sm cursor-pointer leading-relaxed">
            {t('ai.confirm_label')}
          </Label>
        </div>
      )}

      {/* Replace with real photo option */}
      {showAIBadge && (
        <div className="text-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <Camera className="w-4 h-4 mr-2" />
            {t('ai.replace_with_photo')}
          </Button>
        </div>
      )}
    </div>
  );
};
