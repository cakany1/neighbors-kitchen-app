import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChefHat, Shield, Heart, Globe } from 'lucide-react';
import { HeroFeedTeaser } from '@/components/HeroFeedTeaser';
import { useTranslation } from 'react-i18next';

const Index = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);
  

  useEffect(() => {
    // Device detection
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  // Desktop Marketing View
  if (!isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10">
        {/* Navigation Header */}
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChefHat className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold text-foreground">Neighbors Kitchen</span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => navigate('/login')}
              >
                Einloggen
              </Button>
              <Button
                variant="default"
                onClick={() => navigate('/feed')}
              >
                App Starten
              </Button>
            </div>
          </div>
        </header>

        {/* Language Switcher */}
        <div className="absolute top-20 right-4 flex gap-2">
          <Button
            variant={i18n.language === 'de' ? 'default' : 'outline'}
            size="sm"
            onClick={() => changeLanguage('de')}
          >
            DE
          </Button>
          <Button
            variant={i18n.language === 'en' ? 'default' : 'outline'}
            size="sm"
            onClick={() => changeLanguage('en')}
          >
            EN
          </Button>
        </div>

        <main className="container mx-auto px-4 py-16">
          {/* Hero Section - Centered Vertical Layout */}
          <div className="flex flex-col items-center text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-6">
              <ChefHat className="w-16 h-16 text-primary" />
              <h1 className="text-6xl font-bold text-foreground">
                Neighbors Kitchen
              </h1>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2 mb-4">
              📍 {i18n.language === 'de' ? 'Exklusiv in Basel' : 'Exclusive to Basel'}
            </Badge>
            <p className="text-xl text-muted-foreground max-w-2xl mb-8">
              {i18n.language === 'de' 
                ? 'Teile Essen, baue Vertrauen, rette Lebensmittel in deiner Nachbarschaft'
                : 'Share food, build trust, save meals in your neighborhood'}
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button
                size="lg"
                className="text-lg px-8 py-6 h-auto bg-primary hover:bg-primary/90"
                onClick={() => navigate('/feed')}
              >
                {i18n.language === 'de' ? 'App Starten' : 'Start App'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 h-auto"
                onClick={() => navigate('/signup')}
              >
                {i18n.language === 'de' ? 'Der Community beitreten' : 'Join Community'}
              </Button>
            </div>
            
            {/* Meal Preview Cards */}
            <HeroFeedTeaser />
          </div>

          {/* How it Works */}
          <section className="mb-16">
            <h2 className="text-4xl font-bold text-center mb-12">
              {i18n.language === 'de' ? 'Wie es funktioniert' : 'How it Works'}
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-5xl mb-4 text-center">🍝</div>
                  <h3 className="font-bold text-lg mb-2 text-center">
                    {i18n.language === 'de' ? '1. Essen teilen' : '1. Share Food'}
                  </h3>
                  <p className="text-sm text-muted-foreground text-center">
                    {i18n.language === 'de'
                      ? 'Koche zu viel? Teile überschüssiges Essen mit deinen Nachbarn.'
                      : 'Cooked too much? Share excess food with your neighbors.'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-5xl mb-4 text-center">🤝</div>
                  <h3 className="font-bold text-lg mb-2 text-center">
                    {i18n.language === 'de' ? '2. Nachbarn treffen' : '2. Meet Neighbors'}
                  </h3>
                  <p className="text-sm text-muted-foreground text-center">
                    {i18n.language === 'de'
                      ? 'Lerne deine Nachbarn kennen und baue Vertrauen in deiner Community auf.'
                      : 'Get to know your neighbors and build trust in your community.'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-5xl mb-4 text-center">⭐</div>
                  <h3 className="font-bold text-lg mb-2 text-center">
                    {i18n.language === 'de' ? '3. Karma verdienen' : '3. Earn Karma'}
                  </h3>
                  <p className="text-sm text-muted-foreground text-center">
                    {i18n.language === 'de'
                      ? 'Sammle Karma-Punkte durch Teilen und faire Bezahlung.'
                      : 'Collect Karma points through sharing and fair payment.'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Safety Rules */}
          <section className="mb-16">
            <h2 className="text-4xl font-bold text-center mb-12">
              {i18n.language === 'de' ? 'Sicherheitsregeln' : 'Safety Rules'}
            </h2>
            <Card className="max-w-3xl mx-auto">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">
                      {i18n.language === 'de' ? 'Vertrauens-Community' : 'Trust Community'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {i18n.language === 'de'
                        ? 'Verifizierte Profile (Blauer Haken) schaffen Sicherheit. Jeder kann sofort loslegen, Verifizierung ist optional.'
                        : 'Verified profiles (Blue Badge) create trust. Everyone can start immediately, verification is optional.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Heart className="w-6 h-6 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">
                      {i18n.language === 'de' ? 'Respektiere private Räume' : 'Respect Private Spaces'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {i18n.language === 'de'
                        ? 'Bring deine eigene Box mit. Respektiere die Wohnungen der Köche.'
                        : 'Bring your own container. Respect chef homes.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="w-6 h-6 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">
                      {i18n.language === 'de' ? 'Community über Kommerz' : 'Community over Commerce'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {i18n.language === 'de'
                        ? 'Zahle fair. Dies ist eine Sharing-Community, kein Restaurant.'
                        : 'Pay fairly. This is a sharing community, not a restaurant.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* About */}
          <section className="text-center">
            <h2 className="text-4xl font-bold mb-6">
              {i18n.language === 'de' ? 'Über uns' : 'About Us'}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              {i18n.language === 'de'
                ? 'Neighbors Kitchen ist eine hyperlocale Food-Sharing-Plattform für Basel. Unser Ziel: Lebensmittelverschwendung reduzieren, Nachbarn verbinden und eine multikulturelle Community aufbauen.'
                : 'Neighbors Kitchen is a hyperlocal food-sharing platform for Basel. Our goal: reduce food waste, connect neighbors, and build a multicultural community.'}
            </p>
            <Badge variant="secondary" className="text-sm px-4 py-2">
              Made with ❤️ in Basel
            </Badge>
          </section>
        </main>
      </div>
    );
  }

  // Mobile App Entry View
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 flex flex-col items-center justify-center px-4">
      <div className="text-center mb-12">
        <ChefHat className="w-20 h-20 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Neighbors Kitchen
        </h1>
        <p className="text-lg text-muted-foreground">Basel</p>
      </div>

      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="pt-6 space-y-4">
          <Button
            className="w-full h-12"
            size="lg"
            onClick={() => navigate('/login')}
          >
            Anmelden
          </Button>
          
          <Button
            className="w-full h-12"
            variant="outline"
            size="lg"
            onClick={() => navigate('/signup')}
          >
            Registrieren
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                oder
              </span>
            </div>
          </div>

          <Button
            className="w-full h-12"
            variant="secondary"
            size="lg"
            onClick={() => navigate('/feed?guest=true')}
          >
            Als Gast umschauen
          </Button>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground text-center mt-8 max-w-sm">
        Teile Essen, baue Vertrauen, rette Lebensmittel in deiner Nachbarschaft
      </p>
    </div>
  );
};

export default Index;
