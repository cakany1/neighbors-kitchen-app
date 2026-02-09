import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Smartphone, Share2, Menu, Plus, ExternalLink, Download, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

// Placeholder URLs – replace with actual store links once published
const APP_STORE_URL = ''; // e.g. https://apps.apple.com/app/neighbors-kitchen/id...
const PLAY_STORE_URL = ''; // e.g. https://play.google.com/store/apps/details?id=...

const Install = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [pwaOpen, setPwaOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="mb-6 text-center">
          <Smartphone className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t('install.title', 'App herunterladen')}
          </h1>
          <p className="text-muted-foreground">
            {t('install.subtitle_store', 'Neighbors Kitchen ist im App Store und bei Google Play erhältlich.')}
          </p>
        </div>

        {/* Native App Store Links */}
        <Card className="mb-6 border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              {t('install.download_app', 'App herunterladen')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-between h-14 text-left"
              disabled={!APP_STORE_URL}
              onClick={() => APP_STORE_URL && window.open(APP_STORE_URL, '_blank')}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🍎</span>
                <div>
                  <p className="font-medium text-sm">{t('install.download_on', 'Laden im')}</p>
                  <p className="font-bold">App Store</p>
                </div>
              </div>
              {APP_STORE_URL ? (
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Badge variant="secondary" className="text-xs">
                  {t('install.coming_soon', 'Bald verfügbar')}
                </Badge>
              )}
            </Button>

            <Button
              variant="outline"
              className="w-full justify-between h-14 text-left"
              disabled={!PLAY_STORE_URL}
              onClick={() => PLAY_STORE_URL && window.open(PLAY_STORE_URL, '_blank')}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🤖</span>
                <div>
                  <p className="font-medium text-sm">{t('install.get_it_on', 'Jetzt bei')}</p>
                  <p className="font-bold">Google Play</p>
                </div>
              </div>
              {PLAY_STORE_URL ? (
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Badge variant="secondary" className="text-xs">
                  {t('install.coming_soon', 'Bald verfügbar')}
                </Badge>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Push Notifications Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">🔔 {t('install.notifications_title', 'Benachrichtigungen')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t('install.notifications_desc', 'Nach der Installation wirst du gefragt, ob du Push-Benachrichtigungen erhalten möchtest. Damit erfährst du sofort, wenn ein neues Gericht in deiner Nähe angeboten wird.')}
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span>{t('install.notif_new_meals', 'Neue Gerichte in deiner Umgebung')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span>{t('install.notif_booking_updates', 'Updates zu deinen Buchungen')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span>{t('install.notif_messages', 'Nachrichten von Köch*innen')}</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* PWA Fallback — hidden behind collapsible */}
        <Collapsible open={pwaOpen} onOpenChange={setPwaOpen}>
          <CollapsibleTrigger asChild>
            <button className="w-full text-center text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors py-2 flex items-center justify-center gap-1">
              {t('install.alternative_install', 'Alternative Installation (Browser)')}
              <ChevronDown className={`w-3 h-3 transition-transform ${pwaOpen ? 'rotate-180' : ''}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-2">
            {/* iOS PWA */}
            <Card className="border-muted">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span>🍎</span> iPhone (Safari)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <p>1. Tippe auf <Share2 className="inline w-3 h-3" /> (Teilen-Menü)</p>
                <p>2. Wähle "Zum Home-Bildschirm"</p>
                <p>3. Bestätigen</p>
              </CardContent>
            </Card>

            {/* Android PWA */}
            <Card className="border-muted">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span>🤖</span> Android (Chrome)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <p>1. Tippe auf <Menu className="inline w-3 h-3" /> (Menü)</p>
                <p>2. Wähle "App installieren"</p>
                <p>3. Bestätigen</p>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        <div className="mt-8 text-center">
          <Button onClick={() => navigate('/feed')} size="lg" className="w-full">
            {t('install.back_to_app', 'Zurück zur App')}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Install;