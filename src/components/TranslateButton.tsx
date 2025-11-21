import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';
import { toast } from 'sonner';

interface TranslateButtonProps {
  originalText: string;
  onTranslate: (translatedText: string) => void;
}

export const TranslateButton = ({ originalText, onTranslate }: TranslateButtonProps) => {
  const { t } = useTranslation();
  const [isTranslated, setIsTranslated] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const handleTranslate = () => {
    if (isTranslated) {
      // Toggle back to original
      onTranslate(originalText);
      setIsTranslated(false);
      return;
    }

    setIsTranslating(true);
    
    // Mock translation API
    setTimeout(() => {
      const mockTranslation = `${originalText} (Translated)`;
      onTranslate(mockTranslation);
      setIsTranslated(true);
      setIsTranslating(false);
      toast.success(t('toast.translated_successfully'));
    }, 500);
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
