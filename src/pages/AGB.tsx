import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const AGB = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8 pb-24">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('legal.back_home')}
        </Button>
        <h1 className="text-3xl font-bold text-foreground mb-6">
          {t('legal.agb_title')}
        </h1>
        
        {/* English Disclaimer (only shown when language is EN) */}
        {i18n.language === 'en' && (
          <div className="mb-6 p-4 bg-muted/50 border border-border rounded-lg">
            <p className="text-sm text-muted-foreground italic">
              Note: For legal reasons, these terms are currently available in German only. In case of doubt, the German version applies.
            </p>
          </div>
        )}
        
        <div className="space-y-6 text-foreground">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Geltungsbereich</h2>
            <p className="text-muted-foreground leading-relaxed">
              Neighbors Kitchen ist eine Vermittlungsplattform für das Teilen von Lebensmitteln innerhalb einer Gemeinschaft. Neighbors Kitchen vermittelt keine Kaufverträge über Speisen im gewerblichen Sinne. Es handelt sich um eine Gemeinschaft zur Vermeidung von Lebensmittelverschwendung. Die Verträge über das Teilen von Lebensmitteln kommen ausschliesslich zwischen dem anbietenden Nutzer (Koch) und dem abnehmenden Nutzer (Gast) zustande.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Unkostenbeiträge & Zahlung</h2>
            <p className="text-muted-foreground leading-relaxed">
              Die Nutzung der Plattform ist grundsätzlich kostenlos. Zahlungen gelten als freiwillige Unkostenbeiträge (für Zutaten/Energie) oder Schenkungen an den Koch. Bei Transaktionen über die Plattform wird eine Servicegebühr von CHF 2.00 erhoben. Diese Gebühr dient dem Betrieb der Plattform und wird bei der Buchung direkt einbehalten.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Haftung & Hygiene</h2>
            <p className="text-muted-foreground leading-relaxed">
              Die Köche sind allein verantwortlich für die Qualität, Hygiene und Deklaration der Inhaltsstoffe (Allergene) ihrer Speisen. Neighbors Kitchen übernimmt keine Haftung für gesundheitliche Schäden, die aus dem Konsum der vermittelten Speisen entstehen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Stornierung</h2>
            <p className="text-muted-foreground leading-relaxed">
              Buchungen sind verbindlich. Stornierungen sind nur bis zu dem vom Koch festgelegten Zeitpunkt möglich. Bei Nichterscheinen (No-Show) besteht kein Anspruch auf Rückerstattung der Servicegebühr.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Datenschutz</h2>
            <p className="text-muted-foreground leading-relaxed">
              Wir behandeln Ihre Daten vertraulich und geben sie nicht an Dritte weiter, ausser dies ist für die Abwicklung der Buchung notwendig (z.B. Weitergabe der Adresse an den Gast nach Buchung). Wir nutzen Stripe für Zahlungen; es gelten deren Datenschutzbestimmungen.
            </p>
          </section>
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default AGB;
