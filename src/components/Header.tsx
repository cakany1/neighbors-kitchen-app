import { ChefHat, User, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="bg-card border-b border-border sticky top-0 z-40">
      <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <ChefHat className="w-6 h-6 text-primary" />
          <h1 className="font-bold text-xl text-foreground">Neighbors Kitchen</h1>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/faq')}
            title="Hilfe &amp; FAQ"
          >
            <HelpCircle className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/login')}
          >
            <User className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};
