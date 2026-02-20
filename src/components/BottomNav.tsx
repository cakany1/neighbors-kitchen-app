import { Home, Map, PlusCircle, User, Handshake } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AuthInterstitialModal } from '@/components/AuthInterstitialModal';

export const BottomNav = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleProtectedNav = (e: React.MouseEvent) => {
    if (isAuthenticated === false) {
      e.preventDefault();
      setShowAuthModal(true);
    }
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 pwa-safe-bottom">
        <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2">
          <NavLink
            to="/feed"
            data-tour="feed"
            className="flex flex-col items-center gap-1 text-muted-foreground transition-colors px-2"
            activeClassName="text-primary"
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">{t('navigation.feed')}</span>
          </NavLink>
          
          <NavLink
            to="/map"
            data-tour="map"
            className="flex flex-col items-center gap-1 text-muted-foreground transition-colors px-2"
            activeClassName="text-primary"
          >
            <Map className="w-5 h-5" />
            <span className="text-[10px] font-medium">{t('navigation.map')}</span>
          </NavLink>
          
          <NavLink
            to="/add-meal"
            data-tour="add-meal"
            className="flex flex-col items-center gap-1 text-muted-foreground transition-colors px-2"
            activeClassName="text-primary"
            onClick={(e) => handleProtectedNav(e)}
          >
            <PlusCircle className="w-5 h-5" />
            <span className="text-[10px] font-medium">{t('navigation.addMeal')}</span>
          </NavLink>

          <NavLink
            to="/partnerships"
            data-tour="partnerships"
            className="flex flex-col items-center gap-1 text-muted-foreground transition-colors px-2"
            activeClassName="text-primary"
          >
            <Handshake className="w-5 h-5" />
            <span className="text-[10px] font-medium">{t('navigation.partnerships')}</span>
          </NavLink>
          
          <NavLink
            to="/profile"
            data-tour="profile"
            className="flex flex-col items-center gap-1 text-muted-foreground transition-colors px-2"
            activeClassName="text-primary"
            onClick={(e) => handleProtectedNav(e)}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium">{t('navigation.profile')}</span>
          </NavLink>
        </div>
      </nav>

      <AuthInterstitialModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSignup={() => { setShowAuthModal(false); navigate('/signup'); }}
      />
    </>
  );
};
