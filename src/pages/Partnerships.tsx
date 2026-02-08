import { useTranslation } from 'react-i18next';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Users, 
  Heart, 
  Leaf, 
  Shield, 
  BarChart3, 
  Mail,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

const Partnerships = () => {
  const { t, i18n } = useTranslation();
  const isGerman = i18n.language === 'de';

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {isGerman ? 'Partnerschaften' : 'Partnerships'}
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            {isGerman 
              ? 'Neighbors Kitchen als digitale Nachbarschaftsinfrastruktur für Quartiere, Gemeinden & Organisationen.'
              : 'Neighbors Kitchen as digital neighborhood infrastructure for districts, municipalities & organizations.'}
          </p>
        </div>

        {/* Value Propositions */}
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              {isGerman ? 'Warum Neighbors Kitchen?' : 'Why Neighbors Kitchen?'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Users className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">
                  {isGerman ? 'Soziale Isolation reduzieren' : 'Reduce Social Isolation'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isGerman 
                    ? 'Niedrigschwellige Begegnungen zwischen Nachbarn fördern.'
                    : 'Foster low-barrier encounters between neighbors.'}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Leaf className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">
                  {isGerman ? 'Lebensmittelverschwendung verringern' : 'Reduce Food Waste'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isGerman 
                    ? 'Überschüssiges Essen wird geteilt statt weggeworfen.'
                    : 'Surplus food is shared instead of thrown away.'}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">
                  {isGerman ? 'Selbstorganisierte Community' : 'Self-Organized Community'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isGerman 
                    ? 'Institutionen wirken unterstützend – nicht steuernd.'
                    : 'Institutions support – they don\'t control.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How it works for institutions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              {isGerman ? 'So funktioniert die Partnerschaft' : 'How Partnership Works'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">1</div>
              <p className="text-sm text-muted-foreground">
                {isGerman 
                  ? 'Gemeinde oder Organisation wird als Förderpartner gelistet.'
                  : 'Municipality or organization is listed as a supporting partner.'}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">2</div>
              <p className="text-sm text-muted-foreground">
                {isGerman 
                  ? 'Quartiere oder Wohnbaugenossenschaften werden gezielt eingeführt.'
                  : 'Districts or housing cooperatives are specifically onboarded.'}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">3</div>
              <p className="text-sm text-muted-foreground">
                {isGerman 
                  ? 'Anonymisierte Wirkungsdaten werden auf Wunsch bereitgestellt.'
                  : 'Anonymized impact data is provided upon request.'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Impact Data */}
        <Card className="border-secondary/30 bg-gradient-to-br from-secondary/5 to-secondary/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-secondary" />
              {isGerman ? 'Anonymisierte Wirkungsdaten' : 'Anonymized Impact Data'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              {isGerman 
                ? 'Auf Wunsch stellen wir Partnern aggregierte Statistiken bereit:'
                : 'Upon request, we provide partners with aggregated statistics:'}
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-secondary" />
                {isGerman ? 'Anzahl geteilter Mahlzeiten' : 'Number of shared meals'}
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-secondary" />
                {isGerman ? 'Aktive Haushalte pro Quartier' : 'Active households per district'}
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-secondary" />
                {isGerman ? 'Geschätzte CO₂-Einsparung' : 'Estimated CO₂ savings'}
              </li>
            </ul>
            <p className="text-xs text-muted-foreground mt-3 italic">
              {isGerman 
                ? '* Es werden keine personenbezogenen Daten weitergegeben.'
                : '* No personal data is shared.'}
            </p>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {isGerman ? 'Häufige Fragen' : 'Frequently Asked Questions'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="q1">
                <AccordionTrigger className="text-left text-sm">
                  {isGerman 
                    ? 'Ist Neighbors Kitchen ein kommerzieller Anbieter?'
                    : 'Is Neighbors Kitchen a commercial provider?'}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm">
                  {isGerman 
                    ? 'Nein. Neighbors Kitchen ist eine Vermittlungsplattform. Mahlzeiten werden privat geteilt. Freiwillige Kostenbeiträge dienen lediglich der Deckung von Zutaten oder Energie.'
                    : 'No. Neighbors Kitchen is a platform for connecting neighbors. Meals are shared privately. Voluntary contributions only cover ingredient or energy costs.'}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="q2">
                <AccordionTrigger className="text-left text-sm">
                  {isGerman 
                    ? 'Welche Rolle hat eine Gemeinde oder Organisation?'
                    : 'What role does a municipality or organization play?'}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm">
                  {isGerman 
                    ? 'Gemeinden können Neighbors Kitchen ideell oder organisatorisch unterstützen (z. B. Einführung auf Quartiersebene). Die Community bleibt dabei selbstorganisiert – Institutionen wirken ermöglichend, nicht steuernd.'
                    : 'Municipalities can support Neighbors Kitchen ideally or organizationally (e.g., introduction at district level). The community remains self-organized – institutions enable, they don\'t control.'}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="q3">
                <AccordionTrigger className="text-left text-sm">
                  {isGerman 
                    ? 'Welche Daten erhalten Partner?'
                    : 'What data do partners receive?'}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm">
                  {isGerman 
                    ? 'Auf Wunsch stellen wir anonymisierte Wirkungsdaten zur Verfügung (z. B. Anzahl geteilter Mahlzeiten oder aktive Haushalte). Es werden keine personenbezogenen Daten weitergegeben.'
                    : 'Upon request, we provide anonymized impact data (e.g., number of shared meals or active households). No personal data is shared.'}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="q4">
                <AccordionTrigger className="text-left text-sm">
                  {isGerman 
                    ? 'Gibt es Kosten für eine Partnerschaft?'
                    : 'Are there costs for a partnership?'}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm">
                  {isGerman 
                    ? 'Partnerschaften werden individuell besprochen. Kontaktieren Sie uns für ein unverbindliches Gespräch.'
                    : 'Partnerships are discussed individually. Contact us for a non-binding conversation.'}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Contact CTA */}
        <Card className="border-primary bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="pt-6 text-center space-y-4">
            <Mail className="w-10 h-10 text-primary mx-auto" />
            <div>
              <h3 className="font-semibold text-lg">
                {isGerman ? 'Interesse an einer Partnerschaft?' : 'Interested in a Partnership?'}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {isGerman 
                  ? 'Wir freuen uns über Ihre Kontaktaufnahme.'
                  : 'We look forward to hearing from you.'}
              </p>
            </div>
            <Button 
              size="lg" 
              className="w-full"
              onClick={() => window.location.href = 'mailto:hello@neighbors-kitchen.ch'}
            >
              <Mail className="w-4 h-4 mr-2" />
              hello@neighbors-kitchen.ch
            </Button>
          </CardContent>
        </Card>

        {/* Trust Link */}
        <div className="text-center">
          <Button 
            variant="link" 
            className="text-muted-foreground"
            onClick={() => window.location.href = '/trust'}
          >
            {isGerman ? 'Mehr zu Trust & Safety →' : 'More about Trust & Safety →'}
          </Button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Partnerships;
