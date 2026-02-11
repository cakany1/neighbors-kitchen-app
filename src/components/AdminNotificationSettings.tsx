import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Mail, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

interface NotificationSettings {
  new_registration: boolean;
  new_verification: boolean;
  recipient: string;
}

export const AdminNotificationSettings = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [localSettings, setLocalSettings] = useState<NotificationSettings | null>(null);

  // Fetch current settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['adminNotificationSettings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'email_notifications')
        .single();

      if (error) throw error;
      return data.setting_value as unknown as NotificationSettings;
    },
  });

  // Initialize local state when settings load
  if (settings && !localSettings) {
    setLocalSettings(settings);
  }

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async (newSettings: NotificationSettings) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('admin_settings')
        .update({ 
          setting_value: JSON.parse(JSON.stringify(newSettings)),
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .eq('setting_key', 'email_notifications');

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t('admin.notification_settings_saved'));
      queryClient.invalidateQueries({ queryKey: ['adminNotificationSettings'] });
    },
    onError: (error: Error) => {
      toast.error(t('admin.notification_settings_save_failed') + ': ' + error.message);
    },
  });

  const handleToggle = (key: 'new_registration' | 'new_verification') => {
    if (!localSettings) return;
    setLocalSettings({ ...localSettings, [key]: !localSettings[key] });
  };

  const handleRecipientChange = (value: string) => {
    if (!localSettings) return;
    setLocalSettings({ ...localSettings, recipient: value });
  };

  const handleSave = () => {
    if (!localSettings) return;
    updateMutation.mutate(localSettings);
  };

  const hasChanges = localSettings && settings && (
    localSettings.new_registration !== settings.new_registration ||
    localSettings.new_verification !== settings.new_verification ||
    localSettings.recipient !== settings.recipient
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground mt-2">{t('admin.notification_settings_loading')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          E-Mail-Benachrichtigungen
        </CardTitle>
        <CardDescription>
          Erhalte Benachrichtigungen bei neuen Registrierungen und Verifizierungsanfragen.
          Bei vielen Anmeldungen kannst du diese hier deaktivieren.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recipient Email */}
        <div className="space-y-2">
          <Label htmlFor="recipient" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Empfänger-E-Mail
          </Label>
          <Input
            id="recipient"
            type="email"
            value={localSettings?.recipient || ''}
            onChange={(e) => handleRecipientChange(e.target.value)}
            placeholder="hello@neighbors-kitchen.ch"
          />
          <p className="text-xs text-muted-foreground">
            An diese Adresse werden alle Admin-Benachrichtigungen gesendet.
          </p>
        </div>

        {/* Registration Notifications Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label className="text-base font-medium flex items-center gap-2">
              {localSettings?.new_registration ? (
                <Bell className="w-4 h-4 text-primary" />
              ) : (
                <BellOff className="w-4 h-4 text-muted-foreground" />
              )}
              Neue Registrierungen
            </Label>
            <p className="text-sm text-muted-foreground">
              E-Mail erhalten wenn sich neue Nutzer registrieren
            </p>
          </div>
          <Switch
            checked={localSettings?.new_registration || false}
            onCheckedChange={() => handleToggle('new_registration')}
          />
        </div>

        {/* Verification Notifications Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label className="text-base font-medium flex items-center gap-2">
              {localSettings?.new_verification ? (
                <Bell className="w-4 h-4 text-primary" />
              ) : (
                <BellOff className="w-4 h-4 text-muted-foreground" />
              )}
              Verifizierungsanfragen
            </Label>
            <p className="text-sm text-muted-foreground">
              E-Mail erhalten wenn Nutzer eine ID-Verifizierung beantragen
            </p>
          </div>
          <Switch
            checked={localSettings?.new_verification || false}
            onCheckedChange={() => handleToggle('new_verification')}
          />
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={!hasChanges || updateMutation.isPending}
          className="w-full"
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Speichern...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Änderungen speichern
            </>
          )}
        </Button>

        {!localSettings?.new_registration && !localSettings?.new_verification && (
          <p className="text-sm text-center text-warning">
            ⚠️ Alle Benachrichtigungen sind deaktiviert. Du erhältst keine E-Mails mehr.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
