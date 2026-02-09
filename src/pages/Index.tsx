import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChefHat, Shield, Heart, Globe } from 'lucide-react';
import { HeroFeedTeaser } from '@/components/HeroFeedTeaser';
import { Footer } from '@/components/Footer';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);
  
  // Handle OAuth callback tokens that land on root (custom domain BYOK flow)
  useEffect(() => {
    const handleOAuthTokens = async () => {
      const hash = location.hash;
      
      // Check if we have OAuth tokens in the URL hash
      if (hash && hash.includes('access_token')) {
        console.log('OAuth tokens detected on Index page, processing...');
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          
          if (data.session) {
            console.log('Session established from OAuth tokens');
            // Clear the hash and redirect to feed
            window.history.replaceState(null, '', window.location.pathname);
            navigate('/feed', { replace: true });
            return;
          } else if (error) {
            console.error('Failed to set session from tokens:', error);
          }
        }
      }
    };
    
    handleOAuthTokens();
  }, [location.hash, navigate]);

  useEffect(() => {
    // Device detection
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const changeLanguage = async (lang: string) => {
    await i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  // Desktop Marketing View
  if (!isMobile) {
    return (
      <div className="min-h-screen w-full bg-[#FDFCFB]">
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
                onClick={() => navigate('/story')}
              >
                {t('landing.about_us')}
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/install')}
              >
                {t('install.download_app', 'App herunterladen')}
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/login')}
              >
                {t('landing.login')}
              </Button>
              <Button
                variant="default"
                onClick={() => navigate('/signup')}
              >
                {t('landing.join_now')}
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

        <main className="container mx-auto px-4 py-16 pb-24 md:pb-16">
          {/* Hero Section - Centered Vertical Layout */}
          <div className="flex flex-col items-center text-center mb-16">
            {/* Title */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <ChefHat className="w-16 h-16 text-primary" />
              <h1 className="text-6xl font-bold text-foreground">
                Neighbors Kitchen
              </h1>
            </div>
            
            {/* Subtitle */}
            <Badge variant="secondary" className="text-lg px-4 py-2 mb-4">
              📍 {t('landing.exclusive_basel')}
            </Badge>
            <p className="text-xl text-muted-foreground max-w-2xl mb-8">
              {t('landing.tagline')}
            </p>
            
            {/* Meal Preview Cards */}
            <div>
              <HeroFeedTeaser />
            </div>
          </div>

          {/* How it Works */}
          <section className="mb-16">
            <h2 className="text-4xl font-bold text-center mb-12">
              {t('landing.how_it_works')}
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-5xl mb-4 text-center">🍝</div>
                  <h3 className="font-bold text-lg mb-2 text-center">
                    {t('landing.share_food')}
                  </h3>
                  <p className="text-sm text-muted-foreground text-center">
                    {t('landing.share_food_desc')}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-5xl mb-4 text-center">🤝</div>
                  <h3 className="font-bold text-lg mb-2 text-center">
                    {t('landing.meet_neighbors')}
                  </h3>
                  <p className="text-sm text-muted-foreground text-center">
                    {t('landing.meet_neighbors_desc')}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-5xl mb-4 text-center">⭐</div>
                  <h3 className="font-bold text-lg mb-2 text-center">
                    {t('landing.earn_karma')}
                  </h3>
                   <p className="text-sm text-muted-foreground text-center">
                     {t('landing.earn_karma_desc')}
                   </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Safety Rules */}
          <section className="mb-16">
            <h2 className="text-4xl font-bold text-center mb-12">
              {t('landing.safety_rules')}
            </h2>
            <Card className="max-w-3xl mx-auto">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">
                      {t('landing.trust_community')}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {t('landing.trust_community_desc')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Heart className="w-6 h-6 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">
                      {t('landing.respect_private_spaces')}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {t('landing.respect_private_spaces_desc')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="w-6 h-6 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">
                      {t('landing.community_over_commerce')}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {t('landing.community_over_commerce_desc')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

        </main>
        <Footer />
      </div>
    );
  }

  // Mobile App Entry View
  return (
    <div className="min-h-screen w-full bg-[#FDFCFB] flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 pb-24">
      <div className="text-center mb-8">
        <ChefHat className="w-20 h-20 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Neighbors Kitchen
        </h1>
        <p className="text-lg text-muted-foreground mb-4">Basel</p>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          {t('landing.tagline')}
        </p>
      </div>

      <Card className="w-full max-w-md shadow-xl mb-8">
        <CardContent className="pt-6 space-y-4">
          <Button
            className="w-full h-12 bg-primary hover:bg-primary/90"
            size="lg"
            onClick={() => navigate('/feed')}
          >
            {t('landing.start_app')}
          </Button>
          
          <Button
            className="w-full h-12"
            variant="outline"
            size="lg"
            onClick={() => navigate('/login')}
          >
            {t('landing.login')}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {i18n.language === 'de' ? 'oder' : 'or'}
              </span>
            </div>
          </div>

          <Button
            className="w-full h-12"
            variant="secondary"
            size="lg"
            onClick={() => navigate('/feed?guest=true')}
          >
            {t('landing.browse_guest')}
          </Button>
        </CardContent>
      </Card>

      {/* Mobile Meal Preview */}
      <div className="w-full max-w-md">
        <HeroFeedTeaser />
      </div>
      </div>
      <Footer />
    </div>
  );
};

export default Index;
