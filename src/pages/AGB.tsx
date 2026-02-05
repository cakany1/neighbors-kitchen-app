import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
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
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('legal.back_home')}
        </Button>
        <h1 className="text-3xl font-bold text-foreground mb-6">
          Allgemeine Geschäftsbedingungen (AGB)
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
              Neighbors Kitchen ist eine Vermittlungsplattform für das Teilen von selbstgekochtem Essen 
              innerhalb einer Nachbarschaft.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Neighbors Kitchen ist kein gewerblicher Lebensmittelanbieter. 
              Verträge über das Teilen von Speisen kommen ausschliesslich zwischen dem anbietenden Nutzer 
              („Koch") und dem abnehmenden Nutzer („Gast") zustande.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Nutzung der Plattform</h2>
            <p className="text-muted-foreground leading-relaxed">
              Die Nutzung der Plattform ist grundsätzlich kostenlos.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Sofern Köche einen freiwilligen Unkostenbeitrag verlangen (z. B. für Zutaten oder Energie), 
              handelt es sich nicht um einen Verkauf im gewerblichen Sinn, sondern um eine private 
              Kostenbeteiligung oder Schenkung.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Zahlungen</h2>
            <p className="text-muted-foreground leading-relaxed">
              Bei kostenpflichtigen Buchungen wird eine technische Servicegebühr von CHF 2.00 erhoben. 
              Diese dient der Deckung von Zahlungsabwicklung und Plattformbetrieb.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Die Zahlung erfolgt über Stripe. Es gelten zusätzlich die Bedingungen des jeweiligen Zahlungsanbieters.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Verantwortung & Hygiene</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Köche sind selbst verantwortlich für:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Zubereitung</li>
              <li>Hygiene</li>
              <li>Deklaration von Allergenen</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Neighbors Kitchen übernimmt keine Haftung für Qualität oder Verträglichkeit der vermittelten Speisen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Buchungen & Stornierungen</h2>
            <p className="text-muted-foreground leading-relaxed">
              Buchungen sind verbindlich.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Stornierungen sind nur bis zum vom Koch festgelegten Zeitpunkt möglich. 
              Bei Nichterscheinen besteht kein Anspruch auf Rückerstattung der Servicegebühr.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Haftung</h2>
            <p className="text-muted-foreground leading-relaxed">
              Neighbors Kitchen haftet ausschliesslich für Schäden, die auf vorsätzlichem oder 
              grob fahrlässigem Verhalten beruhen.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Für Inhalte, Angebote oder Handlungen der Nutzer übernimmt Neighbors Kitchen keine Verantwortung.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Datenschutz</h2>
            <p className="text-muted-foreground leading-relaxed">
              Die Verarbeitung personenbezogener Daten erfolgt gemäss unserer{' '}
              <Link to="/privacy" className="text-primary hover:underline">
                Datenschutzerklärung
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Änderungen</h2>
            <p className="text-muted-foreground leading-relaxed">
              Neighbors Kitchen behält sich vor, diese AGB jederzeit anzupassen.
            </p>
          </section>
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default AGB;
