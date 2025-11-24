import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smartphone, Share2, Menu, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Install = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="mb-6 text-center">
          <Smartphone className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold text-foreground mb-2">
            App installieren
          </h1>
          <p className="text-muted-foreground">
            Installiere Neighbors Kitchen auf deinem Handy für schnellen Zugriff
          </p>
        </div>

        {/* iOS Installation */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🍎</span>
              iPhone (iOS)
            </CardTitle>
            <CardDescription>
              Für Safari Browser auf iPhone oder iPad
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary text-primary-foreground rounded-full font-bold">
                1
              </div>
              <div className="flex-1">
                <p className="font-medium mb-1">Öffne das Teilen-Menü</p>
                <p className="text-sm text-muted-foreground">
                  Tippe auf den Teilen-Button <Share2 className="inline w-4 h-4" /> unten in der Mitte (Box mit Pfeil nach oben)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary text-primary-foreground rounded-full font-bold">
                2
              </div>
              <div className="flex-1">
                <p className="font-medium mb-1">Scrolle nach unten</p>
                <p className="text-sm text-muted-foreground">
                  Im Menü nach unten scrollen bis du "Zum Home-Bildschirm" siehst
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary text-primary-foreground rounded-full font-bold">
                3
              </div>
              <div className="flex-1">
                <p className="font-medium mb-1">Tippe "Zum Home-Bildschirm"</p>
                <p className="text-sm text-muted-foreground">
                  Die App wird jetzt auf deinem Home-Bildschirm hinzugefügt <Plus className="inline w-4 h-4" />
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Android Installation */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              Android
            </CardTitle>
            <CardDescription>
              Für Chrome oder andere Browser auf Android
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary text-primary-foreground rounded-full font-bold">
                1
              </div>
              <div className="flex-1">
                <p className="font-medium mb-1">Öffne das Browser-Menü</p>
                <p className="text-sm text-muted-foreground">
                  Tippe auf die drei Punkte <Menu className="inline w-4 h-4" /> oben rechts im Browser
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary text-primary-foreground rounded-full font-bold">
                2
              </div>
              <div className="flex-1">
                <p className="font-medium mb-1">Wähle "App installieren"</p>
                <p className="text-sm text-muted-foreground">
                  Oder "Zum Startbildschirm hinzufügen" - der genaue Text variiert je nach Browser
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary text-primary-foreground rounded-full font-bold">
                3
              </div>
              <div className="flex-1">
                <p className="font-medium mb-1">Bestätige die Installation</p>
                <p className="text-sm text-muted-foreground">
                  Die App wird jetzt auf deinem Startbildschirm hinzugefügt <Plus className="inline w-4 h-4" />
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vorteile der installierten App</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span>Schneller Zugriff direkt vom Home-Bildschirm</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span>Funktioniert auch offline</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span>Nimmt weniger Speicherplatz als eine native App</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span>Fühlt sich an wie eine echte App</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Button onClick={() => navigate('/feed')} size="lg" className="w-full">
            Zurück zur App
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Install;
