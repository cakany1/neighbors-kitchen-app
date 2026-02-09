import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { KeyRound, Loader2, Mail, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ChangePasswordSectionProps {
  userEmail: string;
  /** true if user signed up via OAuth (Google etc.) */
  isOAuthUser: boolean;
}

export const ChangePasswordSection = ({ userEmail, isOAuthUser }: ChangePasswordSectionProps) => {
  const { t } = useTranslation();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast.error(t('profile.password_min_length', 'Passwort muss mindestens 8 Zeichen lang sein'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('profile.passwords_dont_match', 'Passwörter stimmen nicht überein'));
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success(t('profile.password_changed', '✅ Passwort erfolgreich geändert'));
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || t('profile.password_change_failed', 'Fehler beim Ändern des Passworts'));
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetEmail = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
      setResetSent(true);
      toast.success(t('profile.reset_email_sent', '📧 E-Mail zum Passwort setzen wurde gesendet'));
    } catch (error: any) {
      toast.error(error.message || 'Fehler');
    } finally {
      setLoading(false);
    }
  };

  if (isOAuthUser) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="w-5 h-5 text-primary" />
            {t('profile.password_section', 'Passwort')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {t('profile.oauth_password_info', 'Du hast dich mit Google angemeldet. Du kannst ein zusätzliches Passwort setzen, um dich auch per E-Mail einzuloggen.')}
            </AlertDescription>
          </Alert>
          {resetSent ? (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
              <Mail className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm text-green-800 dark:text-green-200">
                {t('profile.reset_email_sent_desc', 'Prüfe deine E-Mails und folge dem Link um ein Passwort zu setzen.')}
              </AlertDescription>
            </Alert>
          ) : (
            <Button onClick={handleSendResetEmail} disabled={loading} variant="outline" className="w-full gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              {t('profile.set_password_via_email', 'Passwort per E-Mail setzen')}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="w-5 h-5 text-primary" />
          {t('profile.password_section', 'Passwort ändern')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="new-password">{t('profile.new_password', 'Neues Passwort')}</Label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            minLength={8}
          />
        </div>
        <div>
          <Label htmlFor="confirm-password">{t('profile.confirm_password', 'Passwort bestätigen')}</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <Button onClick={handleChangePassword} disabled={loading || !newPassword || !confirmPassword} className="w-full gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
          {t('profile.change_password_btn', 'Passwort ändern')}
        </Button>
      </CardContent>
    </Card>
  );
};
