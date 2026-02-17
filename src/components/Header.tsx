import { ChefHat, User, HelpCircle, Shield, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export const Header = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Check if user is authenticated and get profile
  // Uses same query key as Profile page to share cache
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      return { ...user, profile };
    },
    staleTime: 0, // Always get fresh data to sync avatar across views
  });

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

  // Handle logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      queryClient.clear();
      toast.success(t('common.logged_out', 'Erfolgreich abgemeldet'));
      navigate('/');
    } catch (error) {
      toast.error(t('common.logout_error', 'Fehler beim Abmelden'));
    }
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-40 pwa-safe-top">
      <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <ChefHat className="w-6 h-6 text-primary" />
          <h1 className="font-bold text-xl text-foreground">Neighbors Kitchen</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/story')}
            className="hidden md:flex"
          >
            {t('landing.about_us')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/install')}
            className="hidden md:flex"
          >
            {t('install.download_app', 'App herunterladen')}
          </Button>
          <LanguageSwitcher />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/faq')}
            title={t('header.help_faq_title', 'Hilfe & FAQ')}
            aria-label={t('header.help_faq_aria', 'Hilfe & FAQ öffnen')}
          >
            <HelpCircle className="w-5 h-5" />
          </Button>
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin')}
              title={t('header.admin_dashboard_title', 'Admin Dashboard')}
              className="relative"
              aria-label={t('header.admin_dashboard_aria', 'Admin Dashboard öffnen')}
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
          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full p-0 w-8 h-8"
                  aria-label={t('header.user_menu_aria', 'Benutzermenü')}
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={currentUser.profile?.avatar_url || undefined} alt="Profile" />
                    <AvatarFallback className="bg-primary/10">
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="w-4 h-4 mr-2" />
                  {t('nav.profile', 'Mein Profil')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  {t('nav.logout', 'Abmelden')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/login')}
              aria-label="Login"
            >
              <User className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
