import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Share2, Menu, Plus, ExternalLink, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Placeholder URLs – replace with actual store links once published
const APP_STORE_URL = ''; // e.g. https://apps.apple.com/app/neighbors-kitchen/id...
const PLAY_STORE_URL = ''; // e.g. https://play.google.com/store/apps/details?id=...

const Install = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="mb-6 text-center">
          <Smartphone className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t('install.title', 'Neighbors Kitchen herunterladen')}
          </h1>
          <p className="text-muted-foreground">
            {t('install.subtitle', 'Lade die App herunter oder installiere sie direkt auf deinem Gerät')}
          </p>
        </div>

        {/* Native App Store Links */}
        <Card className="mb-6 border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              {t('install.native_apps', 'Native App')}
            </CardTitle>
            <CardDescription>
              {t('install.native_apps_desc', 'Erhältlich im App Store und Google Play')}
            </CardDescription>
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

        {/* PWA Fallback Section */}
        <div className="mb-4">
          <p className="text-sm font-medium text-muted-foreground text-center">
            {t('install.or_install_pwa', '— oder direkt im Browser installieren —')}
          </p>
        </div>

        {/* iOS PWA */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🍎</span>
              iPhone (Safari)
            </CardTitle>
            <CardDescription>
              {t('install.pwa_fallback_hint', 'Falls die App noch nicht im Store ist')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary text-primary-foreground rounded-full font-bold">1</div>
              <div className="flex-1">
                <p className="font-medium mb-1">Öffne das Teilen-Menü</p>
                <p className="text-sm text-muted-foreground">Tippe auf 📤 unten in Safari</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary text-primary-foreground rounded-full font-bold">2</div>
              <div className="flex-1">
                <p className="font-medium mb-1">"Zum Home-Bildschirm"</p>
                <p className="text-sm text-muted-foreground">Scrolle und tippe auf die Option</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary text-primary-foreground rounded-full font-bold">3</div>
              <div className="flex-1">
                <p className="font-medium mb-1">Bestätigen</p>
                <p className="text-sm text-muted-foreground">App erscheint auf dem Home-Bildschirm <Plus className="inline w-4 h-4" /></p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Android PWA */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              Android (Chrome)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary text-primary-foreground rounded-full font-bold">1</div>
              <div className="flex-1">
                <p className="font-medium mb-1">Browser-Menü öffnen</p>
                <p className="text-sm text-muted-foreground">Tippe auf <Menu className="inline w-4 h-4" /> oben rechts</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary text-primary-foreground rounded-full font-bold">2</div>
              <div className="flex-1">
                <p className="font-medium mb-1">"App installieren" wählen</p>
                <p className="text-sm text-muted-foreground">Oder "Zum Startbildschirm hinzufügen"</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary text-primary-foreground rounded-full font-bold">3</div>
              <div className="flex-1">
                <p className="font-medium mb-1">Bestätigen</p>
                <p className="text-sm text-muted-foreground">App erscheint auf dem Startbildschirm</p>
              </div>
            </div>
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

        {/* Benefits */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('install.benefits_title', 'Vorteile')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span>{t('install.benefit_fast', 'Schneller Zugriff vom Home-Bildschirm')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span>{t('install.benefit_push', 'Push-Benachrichtigungen für neue Gerichte')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span>{t('install.benefit_native', 'Fühlt sich an wie eine native App')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span>{t('install.benefit_offline', 'Funktioniert auch offline')}</span>
              </li>
            </ul>
          </CardContent>
        </Card>

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
