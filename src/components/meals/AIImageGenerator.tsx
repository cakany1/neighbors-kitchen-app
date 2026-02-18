import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2, Camera, AlertTriangle, RotateCcw } from 'lucide-react';
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
  const [lastError, setLastError] = useState<string | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [retryCountdown, setRetryCountdown] = useState(0);

  const MAX_RETRIES = 3;

  const getRetryDelay = (attempt: number) => Math.min(2000 * Math.pow(2, attempt), 30000);

  const generateAIImage = useCallback(async () => {
    if (!title.trim()) {
      toast.error(t('ai.title_required'));
      return;
    }

    setIsGenerating(true);
    setLastError(null);
    setRetryCountdown(0);
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    
    try {
      const ingredientList = ingredients?.trim() || '';
      const prompt = `Professional food photography of "${title}". ${description ? `Description: ${description}.` : ''} ${ingredientList ? `Ingredients: ${ingredientList}.` : ''} Style: overhead shot on a rustic wooden table with natural lighting, appetizing presentation, home-cooked meal aesthetic. High quality, photorealistic.`;

      const { data, error } = await supabase.functions.invoke('generate-meal-image', {
        body: { prompt }
      });

      if (error) {
        console.error('AI image generation error:', error);
        const errorMsg = error.message || '';
        const errorContext = (error as any)?.context;
        const status = errorContext?.status || 0;
        
        let errorKey = 'ai.generation_failed';
        if (status === 429 || errorMsg.includes('429') || errorMsg.includes('rate limit')) {
          errorKey = 'ai.rate_limit';
        } else if (status === 402 || errorMsg.includes('402') || errorMsg.includes('quota')) {
          errorKey = 'ai.quota_exhausted';
        } else if (status === 401 || status === 403 || errorMsg.includes('401')) {
          errorKey = 'ai.auth_error';
        } else if (errorMsg.includes('timeout') || errorMsg.includes('Timeout')) {
          errorKey = 'ai.timeout';
        }
        toast.error(t(errorKey));
        setLastError(errorKey);
        return;
      }

      if (data?.error) {
        console.error('AI image generation returned error:', data.error);
        let errorKey = 'ai.generation_failed';
        if (data.error === 'rate_limit') errorKey = 'ai.rate_limit';
        else if (data.error === 'quota_exhausted') errorKey = 'ai.quota_exhausted';
        if (errorKey === 'ai.generation_failed' && data.message) {
          toast.error(data.message);
        } else {
          toast.error(t(errorKey));
        }
        setLastError(errorKey);
        return;
      }

      if (data?.imageUrl) {
        setGeneratedImageUrl(data.imageUrl);
        onImageGenerated(data.imageUrl);
        toast.success(t('ai.preview_generated'));
        retryCountRef.current = 0;
        setLastError(null);
      } else {
        toast.error(t('ai.no_image'));
        setLastError('ai.no_image');
      }
    } catch (error) {
      console.error('Failed to generate AI image:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.error(t('ai.network_error'));
        setLastError('ai.network_error');
      } else {
        toast.error(t('ai.generation_failed'));
        setLastError('ai.generation_failed');
      }
    } finally {
      setIsGenerating(false);
    }
  }, [title, description, ingredients, onImageGenerated, t]);

  const handleRetry = useCallback(() => {
    const delay = getRetryDelay(retryCountRef.current);
    retryCountRef.current += 1;

    // Start countdown
    const seconds = Math.ceil(delay / 1000);
    setRetryCountdown(seconds);
    let remaining = seconds;
    const interval = setInterval(() => {
      remaining -= 1;
      setRetryCountdown(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);

    retryTimerRef.current = setTimeout(() => {
      clearInterval(interval);
      setRetryCountdown(0);
      generateAIImage();
    }, delay);
  }, [generateAIImage]);

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
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            <div className="flex items-center gap-2 text-white">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-medium">
                {t('ai.preview_disclaimer')}
              </span>
            </div>
          </div>
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
        disabled={isGenerating || !title.trim() || retryCountdown > 0}
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

      {/* Retry Button - shown after failure */}
      {lastError && !isGenerating && retryCountRef.current < MAX_RETRIES && (
        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-center gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
          onClick={handleRetry}
          disabled={retryCountdown > 0}
        >
          <RotateCcw className="w-4 h-4" />
          {retryCountdown > 0
            ? t('ai.retry_in', { seconds: retryCountdown })
            : t('ai.retry_button')}
        </Button>
      )}

      {/* Max retries exhausted */}
      {lastError && !isGenerating && retryCountRef.current >= MAX_RETRIES && (
        <Alert className="border-destructive/50 bg-destructive/10">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-sm">
            {t('ai.max_retries_reached')}
          </AlertDescription>
        </Alert>
      )}

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
