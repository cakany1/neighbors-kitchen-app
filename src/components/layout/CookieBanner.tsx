import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (consent !== 'true') {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border shadow-lg">
      <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2 flex-1">
          <span className="text-2xl">🍪</span>
          <p className="text-sm text-foreground">
            Wir nutzen Cookies, um die App sicher und funktionstüchtig zu halten (Login & Session). 
            Wir verwenden keine Werbe-Tracker.{' '}
            <Link to="/agb" className="underline text-primary hover:text-primary/80">
              Mehr Infos
            </Link>
          </p>
        </div>
        <Button 
          onClick={handleAccept}
          className="whitespace-nowrap"
        >
          Alles klar
        </Button>
      </div>
    </div>
  );
};
