import { Home, Map, PlusCircle, User } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useTranslation } from 'react-i18next';

export const BottomNav = () => {
  const { t } = useTranslation();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-4">
        <NavLink
          to="/feed"
          data-tour="feed"
          className="flex flex-col items-center gap-1 text-muted-foreground transition-colors"
          activeClassName="text-primary"
        >
          <Home className="w-6 h-6" />
          <span className="text-xs font-medium">{t('navigation.feed')}</span>
        </NavLink>
        
        <NavLink
          to="/map"
          data-tour="map"
          className="flex flex-col items-center gap-1 text-muted-foreground transition-colors"
          activeClassName="text-primary"
        >
          <Map className="w-6 h-6" />
          <span className="text-xs font-medium">{t('navigation.map')}</span>
        </NavLink>
        
        <NavLink
          to="/add-meal"
          data-tour="add-meal"
          className="flex flex-col items-center gap-1 text-muted-foreground transition-colors"
          activeClassName="text-primary"
        >
          <PlusCircle className="w-6 h-6" />
          <span className="text-xs font-medium">{t('navigation.addMeal')}</span>
        </NavLink>
        
        <NavLink
          to="/profile"
          data-tour="profile"
          className="flex flex-col items-center gap-1 text-muted-foreground transition-colors"
          activeClassName="text-primary"
        >
          <User className="w-6 h-6" />
          <span className="text-xs font-medium">{t('navigation.profile')}</span>
        </NavLink>
      </div>
    </nav>
  );
};
