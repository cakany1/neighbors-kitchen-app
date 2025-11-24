import { ChefHat, User, HelpCircle, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export const Header = () => {
  const navigate = useNavigate();

  // Check if current user is admin
  const { data: isAdmin } = useQuery({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      return !!roles;
    },
  });

  // Fetch pending verifications count (only if admin)
  const { data: pendingCount } = useQuery({
    queryKey: ['pendingVerificationsCount'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('verification_status', 'pending');

      if (error) throw error;
      return count || 0;
    },
    enabled: isAdmin === true,
  });

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
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin')}
              title="Admin Dashboard"
              className="relative"
            >
              <Shield className="w-5 h-5" />
              {pendingCount && pendingCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {pendingCount}
                </Badge>
              )}
            </Button>
          )}
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
