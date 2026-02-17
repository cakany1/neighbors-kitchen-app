import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';
import { toast } from 'sonner';

interface TranslateButtonProps {
  originalText: string;
  onTranslate: (translatedText: string) => void;
  sourceLanguage?: string;
  targetLanguage?: string;
}

const MAX_TRANSLATION_LENGTH = 5000;

export const TranslateButton = ({ 
  originalText, 
  onTranslate,
  sourceLanguage = 'de',
  targetLanguage = 'en'
}: TranslateButtonProps) => {
  const { t, i18n } = useTranslation();
  const [isTranslated, setIsTranslated] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const handleTranslate = async () => {
    if (isTranslated) {
      // Toggle back to original
      onTranslate(originalText);
      setIsTranslated(false);
      return;
    }

    // Validate input length
    if (originalText.length === 0) {
      toast.error(t('toast.translate_empty_text', 'Bitte geben Sie Text zum Übersetzen ein'));
      return;
    }

    if (originalText.length > MAX_TRANSLATION_LENGTH) {
      toast.error(t('toast.translate_text_too_long', {
        max: MAX_TRANSLATION_LENGTH,
        current: originalText.length,
        defaultValue: `Text zu lang (max. ${MAX_TRANSLATION_LENGTH} Zeichen, Sie haben ${originalText.length})`
      }));
      return;
    }

    setIsTranslating(true);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate-message`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            text: originalText,
            sourceLanguage,
            targetLanguage,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Translation failed with status ${response.status}`);
      }

      const data = await response.json();
      onTranslate(data.translatedText);
      setIsTranslated(true);
      toast.success(t('toast.translated_successfully', 'Übersetzt'));
    } catch (error) {
      console.error('Translation error:', error);
      toast.error(t('toast.translate_error', 'Fehler beim Übersetzen. Bitte versuchen Sie es später erneut.'));
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleTranslate}
      className="h-8 px-2"
      disabled={isTranslating}
    >
      <Languages className={`w-4 h-4 ${isTranslated ? 'text-primary' : ''}`} />
    </Button>
  );
};
