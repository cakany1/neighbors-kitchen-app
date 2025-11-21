import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';

const Impressum = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8 pb-24">
        <h1 className="text-3xl font-bold text-foreground mb-6">Impressum</h1>
        
        <div className="space-y-6 text-foreground">
          <section>
            <h2 className="text-xl font-semibold mb-3">Kontaktadresse</h2>
            <p className="whitespace-pre-line">
              Neighbors Kitchen
              Yagiz Cakan
              Riehenring 174
              4058 Basel
              Schweiz
            </p>
            <p className="mt-2">E-Mail: cakan.yagiz@gmail.com</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Haftungsausschluss</h2>
            <p className="text-muted-foreground leading-relaxed">
              Der Autor übernimmt keinerlei Gewähr hinsichtlich der inhaltlichen Richtigkeit, 
              Genauigkeit, Aktualität, Zuverlässigkeit und Vollständigkeit der Informationen. 
              Haftungsansprüche gegen den Autor wegen Schäden materieller oder immaterieller Art, 
              welche aus dem Zugriff oder der Nutzung bzw. Nichtnutzung der veröffentlichten 
              Informationen, durch Missbrauch der Verbindung oder durch technische Störungen 
              entstanden sind, werden ausgeschlossen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Haftung für Links</h2>
            <p className="text-muted-foreground leading-relaxed">
              Verweise und Links auf Webseiten Dritter liegen ausserhalb unseres 
              Verantwortungsbereichs. Es wird jegliche Verantwortung für solche Webseiten 
              abgelehnt. Der Zugriff und die Nutzung solcher Webseiten erfolgen auf eigene 
              Gefahr des Nutzers oder der Nutzerin.
            </p>
          </section>
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default Impressum;
