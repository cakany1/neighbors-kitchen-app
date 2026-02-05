import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Impressum = () => {
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
        <h1 className="text-3xl font-bold text-foreground mb-6">Impressum</h1>
        
        {/* English Disclaimer (only shown when language is EN) */}
        {i18n.language === 'en' && (
          <div className="mb-6 p-4 bg-muted/50 border border-border rounded-lg">
            <p className="text-sm text-muted-foreground italic">
              Note: For legal reasons, this imprint is currently available in German only. In case of doubt, the German version applies.
            </p>
          </div>
        )}
        
        <div className="space-y-6 text-foreground">
          {/* Kontakt */}
          <section>
            <div className="p-4 bg-muted/50 border border-border rounded-lg">
              <p className="font-semibold text-lg mb-3">Neighbors Kitchen</p>
              <p className="text-muted-foreground">
                c/o Yagiz Cakan<br />
                Riehenring 174<br />
                4058 Basel<br />
                Schweiz
              </p>
              <p className="text-muted-foreground mt-4 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a href="mailto:hello@neighbors-kitchen.ch" className="text-primary hover:underline">
                  hello@neighbors-kitchen.ch
                </a>
              </p>
            </div>
          </section>

          <section>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Verantwortlich für den Inhalt dieser Website:</strong><br />
              Yagiz Cakan
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Haftungsausschluss</h2>
            <p className="text-muted-foreground leading-relaxed">
              Die Inhalte dieser Website wurden mit grösstmöglicher Sorgfalt erstellt. 
              Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte übernehmen wir jedoch keine Gewähr.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Haftungsansprüche gegen Neighbors Kitchen wegen Schäden materieller oder immaterieller Art, 
              welche aus dem Zugriff oder der Nutzung bzw. Nichtnutzung der veröffentlichten Informationen 
              entstanden sind, werden ausgeschlossen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Haftung für Links</h2>
            <p className="text-muted-foreground leading-relaxed">
              Diese Website enthält Verknüpfungen zu externen Websites Dritter. 
              Auf deren Inhalte haben wir keinen Einfluss. 
              Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. 
              Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter verantwortlich.
            </p>
          </section>
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default Impressum;
