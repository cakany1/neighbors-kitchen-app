import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Smartphone, Bell, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

const FAQ = () => {
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Dein Browser unterstützt keine Benachrichtigungen.');
      return;
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      toast.success('✓ Benachrichtigungen aktiviert!');
      new Notification('Neighbors Kitchen', {
        body: 'Du erhältst jetzt Benachrichtigungen über neue Mahlzeiten in deiner Umgebung.',
        icon: '/icon-192.png',
      });
    } else {
      toast.error('Benachrichtigungen wurden abgelehnt.');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Page Title */}
        <div className="text-center">
          <HelpCircle className="w-12 h-12 text-primary mx-auto mb-3" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Hilfe &amp; FAQ</h1>
          <p className="text-muted-foreground">
            Alles, was du über Neighbors Kitchen wissen musst
          </p>
        </div>

        {/* Section A: App Installation & Notifications */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              App installieren &amp; Benachrichtigungen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-foreground mb-2">So nutzt du Neighbors Kitchen richtig</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <Alert>
                  <AlertDescription>
                    <strong className="text-foreground">📱 iPhone (iOS):</strong>
                    <br />
                    Tippe unten auf &quot;Teilen&quot; (Quadrat mit Pfeil) und wähle &quot;Zum Home-Bildschirm&quot;.
                  </AlertDescription>
                </Alert>
                <Alert>
                  <AlertDescription>
                    <strong className="text-foreground">🤖 Android:</strong>
                    <br />
                    Tippe oben auf das Menü (3 Punkte) und wähle &quot;App installieren&quot;.
                  </AlertDescription>
                </Alert>
                <Alert className="border-primary/50 bg-primary/5">
                  <Bell className="w-4 h-4 text-primary" />
                  <AlertDescription>
                    <strong className="text-foreground">🔔 Benachrichtigungen:</strong>
                    <br />
                    Erlaube uns, dich zu benachrichtigen, wenn dein Nachbar kocht!
                  </AlertDescription>
                </Alert>
              </div>
            </div>
            <Button 
              onClick={requestNotificationPermission}
              className="w-full"
            >
              <Bell className="w-4 h-4 mr-2" />
              Benachrichtigungen aktivieren
            </Button>
          </CardContent>
        </Card>

        {/* Section B: FAQ Accordion */}
        <Card>
          <CardHeader>
            <CardTitle>Häufige Fragen (FAQ)</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Wie funktioniert das Bezahlen?</AccordionTrigger>
                <AccordionContent>
                  Aktuell zahlst du digital per Kreditkarte oder über digitale Wallets (Apple Pay, Google Pay). 
                  Der Mindestbetrag deckt die Zutaten und unterstützt die Community.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>Ist das ein Restaurant?</AccordionTrigger>
                <AccordionContent>
                  Nein! Hier kochen private Nachbarn für Nachbarn. Es geht um Gemeinschaft und 
                  die Vermeidung von Lebensmittelverschwendung, nicht um gewerblichen Verkauf.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>Muss ich die Köchin treffen?</AccordionTrigger>
                <AccordionContent>
                  Ja, die Übergabe findet in der Regel persönlich statt (meist an der Haustür). 
                  Bei &quot;Ghost Mode&quot; Angeboten ist auch anonyme Abholung möglich.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger>Was ist der &apos;Ladies Only&apos; Modus?</AccordionTrigger>
                <AccordionContent>
                  Frauen können einstellen, dass ihre Angebote nur für andere Frauen sichtbar sind. 
                  Dies erhöht die Sicherheit und schafft einen geschützten Raum für weibliche Nutzerinnen.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger>Was passiert, wenn ich nicht erscheine?</AccordionTrigger>
                <AccordionContent>
                  Das ist unfair gegenüber dem Koch! Wer nicht erscheint, ohne abzusagen, erhält 
                  eine schlechte Bewertung und kann im schlimmsten Fall gesperrt werden. 
                  Du kannst Buchungen innerhalb von 15 Minuten kostenlos stornieren.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger>Kann ich auch tauschen?</AccordionTrigger>
                <AccordionContent>
                  Ja! Viele Köche akzeptieren Tauschhandel (z.B. Dessert gegen Hauptspeise oder 
                  eine Flasche Wein). Nach dem Essen kannst du wählen, ob du Geld sendest oder 
                  etwas mitgebracht hast.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7">
                <AccordionTrigger>Sind die Lebensmittel sicher?</AccordionTrigger>
                <AccordionContent>
                  Wir setzen auf Vertrauen &amp; Community-Bewertungen. Jeder Koch kann sich 
                  verifizieren lassen (Telefon + Ausweis), um ein ✓ Verifiziert-Badge zu erhalten. 
                  Achte auf Karma-Punkte und Portfolio-Fotos.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-8">
                <AccordionTrigger>Wie werde ich Koch?</AccordionTrigger>
                <AccordionContent>
                  Einfach im Profil auf &quot;Verifizieren lassen&quot; klicken und dein erstes 
                  Gericht über den &quot;+ Mahlzeit hinzufügen&quot; Button posten. 
                  Du kannst sofort loslegen!
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-9">
                <AccordionTrigger>Was kostet die Plattform?</AccordionTrigger>
                <AccordionContent>
                  Die Nutzung der App ist kostenlos. Bei digitalen Transaktionen fällt eine 
                  kleine Servicegebühr (10%) an, um die Plattform zu betreiben und weiterzuentwickeln.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-10">
                <AccordionTrigger>Wo sehe ich den genauen Standort?</AccordionTrigger>
                <AccordionContent>
                  Zum Schutz der Privatsphäre siehst du die genaue Adresse erst nach der 
                  Buchungsbestätigung durch den Koch. Vorher wird nur die ungefähre 
                  Nachbarschaft angezeigt.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Additional Help Card */}
        <Card className="border-muted">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Weitere Fragen? Kontaktiere uns über das Feedback-Formular im Profil.
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => window.location.href = '/impressum'}>
                Impressum
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/agb'}>
                AGB
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
};

export default FAQ;
