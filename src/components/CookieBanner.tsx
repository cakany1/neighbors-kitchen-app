import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('cookie_consent')) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background shadow-lg p-4 border-t border-border">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-sm text-foreground">
          Wir nutzen essenzielle Cookies für die Funktion der App.{' '}
          <a href="/agb" className="underline text-primary">
            Infos
          </a>
        </p>
        <Button onClick={handleAccept} size="sm">
          Ok
        </Button>
      </div>
    </div>
  );
};
