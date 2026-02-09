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

        {/* Neutral coming-soon buttons */}
        <div className="space-y-3 mb-4">
          <Button
            variant="outline"
            className="w-full h-13 text-base font-medium opacity-50 cursor-default pointer-events-none"
            disabled
          >
            App Store – {isDE ? 'bald verfügbar' : 'coming soon'}
          </Button>

          <Button
            variant="outline"
            className="w-full h-13 text-base font-medium opacity-50 cursor-default pointer-events-none"
            disabled
          >
            Google Play – {isDE ? 'bald verfügbar' : 'coming soon'}
          </Button>
        </div>

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
