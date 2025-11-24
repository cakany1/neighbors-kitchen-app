import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Download, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt = () => {
  const location = useLocation();
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Check if prompt was already dismissed
    const promptDismissed = sessionStorage.getItem('pwa-prompt-dismissed');

    // Always define cleanup to avoid inconsistent returns
    let cleanup: (() => void) | undefined;

    if (!standalone && !promptDismissed) {
      // For Android: Listen for beforeinstallprompt
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setShowPrompt(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      // For iOS: Show manual prompt after delay
      if (ios) {
        setTimeout(() => setShowPrompt(true), 3000);
      }

      cleanup = () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }

    return () => {
      cleanup?.();
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowPrompt(false);
      }
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // Don't show on landing page or if already installed/dismissed
  if (location.pathname === '/' || isStandalone || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 px-4 animate-in slide-in-from-bottom-5 duration-500">
      <Card className="bg-primary text-primary-foreground shadow-lg border-none">
        <div className="p-4 flex items-start gap-3">
          <div className="flex-1">
            {isIOS ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <Download className="h-5 w-5" />
                  <p className="font-semibold text-sm">App installieren</p>
                </div>
                <p className="text-xs opacity-90 leading-relaxed">
                  Installiere die App für Benachrichtigungen: Tippe auf{' '}
                  <Share className="inline h-4 w-4 mx-1" />
                  <span className="font-semibold">"Teilen"</span> und dann auf{' '}
                  <span className="font-semibold">"Zum Home-Bildschirm"</span>
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <Download className="h-5 w-5" />
                  <p className="font-semibold text-sm">App installieren</p>
                </div>
                <p className="text-xs opacity-90 mb-3">
                  Installiere Neighbors Kitchen für schnelleren Zugriff und Benachrichtigungen
                </p>
                <Button
                  onClick={handleInstallClick}
                  variant="secondary"
                  size="sm"
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Jetzt installieren
                </Button>
              </>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};
