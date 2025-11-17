import { Home, Map, PlusCircle, User } from 'lucide-react';
import { NavLink } from '@/components/NavLink';

export const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-4">
        <NavLink
          to="/"
          className="flex flex-col items-center gap-1 text-muted-foreground transition-colors"
          activeClassName="text-primary"
        >
          <Home className="w-6 h-6" />
          <span className="text-xs font-medium">Feed</span>
        </NavLink>
        
        <NavLink
          to="/map"
          className="flex flex-col items-center gap-1 text-muted-foreground transition-colors"
          activeClassName="text-primary"
        >
          <Map className="w-6 h-6" />
          <span className="text-xs font-medium">Map</span>
        </NavLink>
        
        <NavLink
          to="/add-meal"
          className="flex flex-col items-center gap-1 text-muted-foreground transition-colors"
          activeClassName="text-primary"
        >
          <PlusCircle className="w-6 h-6" />
          <span className="text-xs font-medium">Add Meal</span>
        </NavLink>
        
        <NavLink
          to="/profile"
          className="flex flex-col items-center gap-1 text-muted-foreground transition-colors"
          activeClassName="text-primary"
        >
          <User className="w-6 h-6" />
          <span className="text-xs font-medium">Profile</span>
        </NavLink>
      </div>
    </nav>
  );
};
