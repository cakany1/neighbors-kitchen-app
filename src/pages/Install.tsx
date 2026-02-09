import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Smartphone, Share2, Menu, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

// Placeholder URLs – replace with actual store links once published
const APP_STORE_URL = '';
const PLAY_STORE_URL = '';

const Install = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [pwaOpen, setPwaOpen] = useState(false);
  const isDE = i18n.language?.startsWith('de');

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="max-w-lg mx-auto px-4 py-8">
        {/* Hero */}
        <div className="mb-8 text-center">
          <Smartphone className="w-14 h-14 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold text-foreground mb-3">
            {isDE ? 'App herunterladen' : 'Download the app'}
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            {isDE
              ? 'Neighbors Kitchen ist bald im App Store und bei Google Play verfügbar.'
              : 'Neighbors Kitchen will be available soon on the App Store and Google Play.'}
          </p>
        </div>

        {/* Store Buttons */}
        <Card className="mb-6 border-primary/20">
          <CardContent className="pt-6 space-y-3">
            <Button
              variant="outline"
              className="w-full justify-between h-14 text-left"
              disabled={!APP_STORE_URL}
              onClick={() => APP_STORE_URL && window.open(APP_STORE_URL, '_blank')}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🍎</span>
                <div>
                  <p className="font-bold">App Store</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                Coming soon
              </Badge>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-between h-14 text-left"
              disabled={!PLAY_STORE_URL}
              onClick={() => PLAY_STORE_URL && window.open(PLAY_STORE_URL, '_blank')}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">▶️</span>
                <div>
                  <p className="font-bold">Google Play</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                Coming soon
              </Badge>
            </Button>
          </CardContent>
        </Card>

        {/* Notify text */}
        <p className="text-xs text-muted-foreground/70 text-center mb-8">
          {isDE
            ? 'Wir informieren dich, sobald die App verfügbar ist – kein Spam, versprochen.'
            : "We'll notify you when the app is available — no spam, promised."}
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

        <div className="mt-8 text-center">
          <Button onClick={() => navigate('/feed')} size="lg" className="w-full">
            {isDE ? 'Zurück zur App' : 'Back to app'}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Install;
