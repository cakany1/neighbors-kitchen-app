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
      const errorMsg = i18n.language === 'de' 
        ? 'Bitte geben Sie Text zum Übersetzen ein' 
        : 'Please provide text to translate';
      toast.error(errorMsg);
      return;
    }

    if (originalText.length > MAX_TRANSLATION_LENGTH) {
      const errorMsg = i18n.language === 'de'
        ? `Text zu lang (max. ${MAX_TRANSLATION_LENGTH} Zeichen, Sie haben ${originalText.length})`
        : `Text too long (max. ${MAX_TRANSLATION_LENGTH} characters, you have ${originalText.length})`;
      toast.error(errorMsg);
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
      toast.success(t('toast.translated_successfully') || 'Übersetzt');
    } catch (error) {
      console.error('Translation error:', error);
      const errorMsg = i18n.language === 'de'
        ? 'Fehler beim Übersetzen. Bitte versuchen Sie es später erneut.'
        : 'Translation error. Please try again later.';
      toast.error(errorMsg);
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
