import { ChefHat } from 'lucide-react';

export const Header = () => {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-40">
      <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChefHat className="w-6 h-6 text-primary" />
          <h1 className="font-bold text-xl text-foreground">Neighbors Kitchen</h1>
        </div>
      </div>
    </header>
  );
};
