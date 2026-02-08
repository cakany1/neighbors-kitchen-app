import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Lock, Users, ChefHat, Ban, Heart, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

const Trust = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  useEffect(() => {
    document.title = 'Trust & Safety – Neighbors Kitchen';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Vertrauen und Sicherheit bei Neighbors Kitchen. Erfahren Sie, wie wir Ihre Daten schützen und eine respektvolle Community fördern.');
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 pb-24">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück
        </Button>

        <h1 className="text-3xl font-bold text-foreground mb-4">Trust & Safety</h1>
        
        {/* English Disclaimer */}
        {i18n.language === 'en' && (
          <div className="mb-6 p-4 bg-muted/50 border border-border rounded-lg">
            <p className="text-sm text-muted-foreground italic">
              Note: For legal reasons, this page is currently available in German only. 
              In case of doubt, the German version applies.
            </p>
          </div>
        )}

        <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg mb-8">
          <p className="text-foreground leading-relaxed">
            Neighbors Kitchen wurde entwickelt, um Nachbarschaft sicher, respektvoll und transparent zu ermöglichen.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-2">
            Unsere Plattform basiert auf Vertrauen – unterstützt durch klare Regeln und technische Schutzmassnahmen.
          </p>
        </div>

        <div className="space-y-8 text-foreground">
          
          {/* Datenschutz & Privatsphäre */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Datenschutz & Privatsphäre
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span className="text-muted-foreground">Exakte Adressen werden erst nach bestätigter Buchung sichtbar</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span className="text-muted-foreground">Auf Karten wird nur ein ungefährer Standort angezeigt</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span className="text-muted-foreground">Persönliche Daten sind durch Row Level Security geschützt</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span className="text-muted-foreground">Alle Verbindungen sind verschlüsselt (HTTPS)</span>
              </li>
            </ul>
           </section>

           {/* Datenstandort Schweiz */}
           <section>
             <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
               <Globe className="w-5 h-5 text-primary" />
               Datenstandort Schweiz
             </h2>
             <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
               <p className="text-foreground font-medium mb-3">
                 🇨🇭 Alle Nutzerdaten werden ausschliesslich in der Schweiz gespeichert.
               </p>
               <ul className="space-y-3">
                 <li className="flex items-start gap-3">
                   <span className="text-primary mt-1">•</span>
                   <span className="text-muted-foreground">
                     <strong>Region:</strong> AWS Zürich (eu-central-2)
                   </span>
                 </li>
                 <li className="flex items-start gap-3">
                   <span className="text-primary mt-1">•</span>
                   <span className="text-muted-foreground">
                     <strong>Datenschutz:</strong> Unterliegen dem Schweizer Datenschutzgesetz (DSG)
                   </span>
                 </li>
                 <li className="flex items-start gap-3">
                   <span className="text-primary mt-1">•</span>
                   <span className="text-muted-foreground">
                     <strong>Keine Weitergabe:</strong> Daten verlassen die Schweiz nicht
                   </span>
                </li>
               </ul>
               <p className="text-sm text-muted-foreground mt-4 italic">
                 Weitere technische Details: <a href="/privacy" className="text-primary hover:underline">Datenschutzerklärung</a>
               </p>
             </div>
           </section>

           {/* Nutzerkontrollen */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Nutzerkontrollen
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span className="text-muted-foreground">Registrierung erforderlich für Buchungen</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span className="text-muted-foreground">Optionale Verifizierung für Gastgeber</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span className="text-muted-foreground">Melde-Funktion für unangemessenes Verhalten</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span className="text-muted-foreground">Admin-Moderation bei Konflikten</span>
              </li>
            </ul>
          </section>

          {/* Verantwortung der Köche */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-primary" />
              Verantwortung der Köche
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Köche sind selbst verantwortlich für:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span className="text-muted-foreground">Hygiene</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span className="text-muted-foreground">Zutaten</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span className="text-muted-foreground">Allergen-Deklaration</span>
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4 italic">
              Neighbors Kitchen vermittelt ausschliesslich.
            </p>
          </section>

          {/* Null-Toleranz */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Ban className="w-5 h-5 text-destructive" />
              Null-Toleranz bei Missbrauch
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Folgende Inhalte oder Verhaltensweisen sind untersagt:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-3">
                <span className="text-destructive mt-1">✕</span>
                <span className="text-muted-foreground">Diskriminierende Inhalte</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-destructive mt-1">✕</span>
                <span className="text-muted-foreground">Belästigung</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-destructive mt-1">✕</span>
                <span className="text-muted-foreground">Irreführende Angaben</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-destructive mt-1">✕</span>
                <span className="text-muted-foreground">Gewerblicher Verkauf</span>
              </li>
            </ul>
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-foreground font-medium">
                Verstösse führen zur Sperrung des Accounts.
              </p>
            </div>
          </section>

          {/* Gemeinschaft statt Plattform */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              Gemeinschaft statt Plattform
            </h2>
            <div className="p-4 bg-muted/50 border border-border rounded-lg">
              <p className="text-foreground leading-relaxed">
                Neighbors Kitchen ist kein Marktplatz.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                Wir verstehen uns als digitale Nachbarschaftsinfrastruktur – mit Fokus auf 
                Respekt, Nachhaltigkeit und Miteinander.
              </p>
            </div>
          </section>

          {/* Link to Partnerships */}
           <section className="pt-4 border-t border-border">
             <div className="p-4 bg-muted/50 border border-border rounded-lg flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <Users className="w-5 h-5 text-primary" />
                 <span className="text-muted-foreground">
                   Für Quartiere, Gemeinden & Organisationen
                 </span>
               </div>
               <a 
                 href="/partnerships" 
                 className="text-primary hover:underline font-medium text-sm flex items-center gap-1"
               >
                 Mehr erfahren →
               </a>
             </div>
           </section>

        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default Trust;
