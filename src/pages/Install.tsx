import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Share2, Menu, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

const Install = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [pwaOpen, setPwaOpen] = useState(false);
  const isDE = i18n.language?.startsWith('de');

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <main className="max-w-lg mx-auto px-4 py-10">
        {/* Hero */}
        <div className="mb-10 text-center">
          <Heart className="w-12 h-12 mx-auto mb-5 text-primary" />
          <h1 className="text-2xl font-bold text-foreground mb-3">
            {isDE ? 'App bald verfügbar' : 'App coming soon'}
          </h1>
          <p className="text-muted-foreground leading-relaxed text-sm">
            {isDE
              ? 'Neighbors Kitchen erscheint bald im App Store und bei Google Play.'
              : 'Neighbors Kitchen will be available soon on the App Store and Google Play.'}
          </p>
          <p className="text-muted-foreground leading-relaxed text-sm mt-1">
            {isDE
              ? 'Wir geben dir Bescheid, sobald es so weit ist.'
              : "We'll let you know as soon as it's ready."}
          </p>
        </div>

        {/* Store badges */}
        <div className="space-y-3 mb-4">
          {/* App Store Badge */}
          <div className="w-full h-14 rounded-xl bg-black flex items-center justify-center gap-3 opacity-50 cursor-default pointer-events-none px-6">
            <svg viewBox="0 0 24 24" className="w-7 h-7 text-white fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <div className="text-left text-white">
              <div className="text-[10px] leading-tight">{isDE ? 'Laden im' : 'Download on the'}</div>
              <div className="text-lg font-semibold leading-tight">App Store</div>
            </div>
          </div>

          {/* Google Play Badge */}
          <div className="w-full h-14 rounded-xl bg-black flex items-center justify-center gap-3 opacity-50 cursor-default pointer-events-none px-6">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302a1 1 0 0 1 0 1.38l-2.302 2.302L15.3 12l2.398-2.492zM5.864 3.458L16.8 9.79l-2.302 2.302L5.864 3.458z"/>
            </svg>
            <div className="text-left text-white">
              <div className="text-[10px] leading-tight">{isDE ? 'Jetzt bei' : 'GET IT ON'}</div>
              <div className="text-lg font-semibold leading-tight">Google Play</div>
            </div>
          </div>
        </div>

        {/* Coming soon label */}
        <p className="text-xs text-muted-foreground/60 text-center mb-1">
          {isDE ? 'Bald verfügbar' : 'Coming soon'}
        </p>

        {/* Helper text */}
        <p className="text-xs text-muted-foreground/60 text-center mb-10">
          {isDE
            ? 'Offizielle App-Store-Version. Kein Beta-Zugang.'
            : 'Official app store release. No beta access.'}
        </p>

        {/* PWA Fallback — hidden behind collapsible */}
        <Collapsible open={pwaOpen} onOpenChange={setPwaOpen}>
          <CollapsibleTrigger asChild>
            <button className="w-full text-center text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors py-2 flex items-center justify-center gap-1">
              {isDE ? 'Alternative Installation (Browser)' : 'Alternative install (Browser)'}
              <ChevronDown className={`w-3 h-3 transition-transform ${pwaOpen ? 'rotate-180' : ''}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-2">
            <Card className="border-muted">
              <CardContent className="pt-4 space-y-2 text-xs text-muted-foreground">
                <p className="font-medium text-foreground text-sm">🍎 iPhone (Safari)</p>
                <p>1. {isDE ? 'Tippe auf' : 'Tap'} <Share2 className="inline w-3 h-3" /> {isDE ? '(Teilen-Menü)' : '(Share menu)'}</p>
                <p>2. {isDE ? 'Wähle "Zum Home-Bildschirm"' : 'Select "Add to Home Screen"'}</p>
                <p>3. {isDE ? 'Bestätigen' : 'Confirm'}</p>
              </CardContent>
            </Card>
            <Card className="border-muted">
              <CardContent className="pt-4 space-y-2 text-xs text-muted-foreground">
                <p className="font-medium text-foreground text-sm">🤖 Android (Chrome)</p>
                <p>1. {isDE ? 'Tippe auf' : 'Tap'} <Menu className="inline w-3 h-3" /> {isDE ? '(Menü)' : '(Menu)'}</p>
                <p>2. {isDE ? 'Wähle "App installieren"' : 'Select "Install app"'}</p>
                <p>3. {isDE ? 'Bestätigen' : 'Confirm'}</p>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        <div className="mt-10 text-center">
          <Button onClick={() => navigate('/feed')} size="lg" className="w-full">
            {isDE ? 'Weiter zu Neighbors Kitchen' : 'Continue to Neighbors Kitchen'}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Install;
